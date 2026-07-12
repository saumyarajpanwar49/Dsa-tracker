const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
}

function buildEmailHtml(problems) {
  const rows = problems
    .map(
      (p) => `
      <tr style="border-bottom: 1px solid #25382b;">
        <td style="padding: 12px 8px; color: #e8ece9; font-weight: 600;">${p.name}</td>
        <td style="padding: 12px 8px;">
          <a href="${p.link}" style="color: #ff7a00; text-decoration: none; font-family: monospace;">${p.link}</a>
        </td>
        <td style="padding: 12px 8px; color: #7a9282; font-size: 13px;">${p.topic}</td>
        <td style="padding: 12px 8px; color: #a0b5a6; font-size: 13px;">${p.approach.slice(0, 200)}${p.approach.length > 200 ? '…' : ''}</td>
        <td style="padding: 12px 8px;">
          <span style="background:#ff7a00;color:#0c120e;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:bold;">
            ${p.status}
          </span>
        </td>
      </tr>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#0c120e;font-family:Inter,Arial,sans-serif;">
      <div style="max-width:900px;margin:40px auto;background:#142018;border-radius:12px;border:1px solid #25382b;overflow:hidden;">
        <div style="padding:24px 32px;background:#0c120e;border-bottom:1px solid #25382b;">
          <h1 style="margin:0;color:#ff7a00;font-size:22px;">🍥 Konoha DSA Scrolls Reminder</h1>
          <p style="margin:8px 0 0;color:#7a9282;font-size:14px;">
            You have <strong style="color:#e8ece9;">${problems.length}</strong> training mission(s) waiting to be reviewed.
          </p>
        </div>
        <div style="padding:24px 32px;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:2px solid #25382b;">
                <th style="padding:8px;text-align:left;color:#ff7a00;font-size:13px;">Name</th>
                <th style="padding:8px;text-align:left;color:#ff7a00;font-size:13px;">Link</th>
                <th style="padding:8px;text-align:left;color:#ff7a00;font-size:13px;">Topic</th>
                <th style="padding:8px;text-align:left;color:#ff7a00;font-size:13px;">Approach</th>
                <th style="padding:8px;text-align:left;color:#ff7a00;font-size:13px;">Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div style="padding:16px 32px;border-top:1px solid #25382b;text-align:center;">
          <p style="margin:0;color:#7a9282;font-size:12px;">Konoha DSA Tracker — dispatched automatically by Messenger Hawk</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendReminders() {
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const problems = await prisma.problem.findMany({
    where: {
      status: { not: 'solved' },
      createdAt: { lte: fiveDaysAgo },
      reminderSent: false,
    },
  });

  if (problems.length === 0) {
    console.log('📭 No problems due for reminder.');
    return { sent: 0, problems: [] };
  }

  const transporter = createTransporter();
  const html = buildEmailHtml(problems);

  await transporter.sendMail({
    from: `"DSA Tracker" <${process.env.EMAIL_USER}>`,
    to: process.env.MY_EMAIL,
    subject: `📚 DSA Reminder: ${problems.length} problem(s) need your attention`,
    html,
  });

  // Mark all as reminded
  await prisma.problem.updateMany({
    where: { id: { in: problems.map((p) => p.id) } },
    data: { reminderSent: true, lastRemindedAt: new Date() },
  });

  console.log(`✅ Reminder sent for ${problems.length} problem(s).`);
  return { sent: problems.length, problems: problems.map((p) => p.name) };
}

function startCronJob() {
  // Runs every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Cron: running daily reminder check...');
    try {
      await sendReminders();
    } catch (err) {
      console.error('Cron reminder error:', err);
    }
  });
  console.log('📅 Daily reminder cron scheduled (9:00 AM)');
}

module.exports = { sendReminders, startCronJob };

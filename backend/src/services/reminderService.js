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

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function buildEmailHtml(problems) {
  const rows = problems.map((problem) => `
    <tr>
      <td style="padding:12px;color:white;">${escapeHtml(problem.name)}</td>
      <td style="padding:12px;">
        <a href="${escapeHtml(problem.link)}" style="color:#FFD700;">
          Open problem
        </a>
      </td>
      <td style="padding:12px;color:#ccc;">${escapeHtml(problem.topic)}</td>
      <td style="padding:12px;color:#ccc;">
        ${escapeHtml(problem.approach.slice(0, 200))}
      </td>
      <td style="padding:12px;color:#FFD700;">
        ${escapeHtml(problem.status)}
      </td>
    </tr>
  `).join('');

  return `
    <html>
      <body style="background:#000;color:#fff;font-family:Arial,sans-serif;padding:24px;">
        <h2 style="color:#FFD700;">Konoha DSA Reminder</h2>
        <p>You have ${problems.length} problems waiting for review.</p>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="color:#FFD700;text-align:left;">
              <th>Name</th><th>Link</th><th>Topic</th>
              <th>Approach</th><th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;
}

async function sendReminders(userId = null) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    throw new Error('Email configuration is missing');
  }

  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const users = userId
    ? await prisma.user.findMany({
        where: { id: userId, isActive: true },
        select: { id: true, email: true },
      })
    : await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, email: true },
      });

  if (!users.length) {
    return { sent: 0, message: 'No active users found' };
  }

  const transporter = createTransporter();
  let sent = 0;
  const failures = [];

  for (const user of users) {
    const problems = await prisma.problem.findMany({
      where: {
        userId: user.id,
        status: { not: 'solved' },
        createdAt: { lte: fiveDaysAgo },
        reminderSent: false,
      },
    });

    if (!problems.length) continue;

    try {
      await transporter.sendMail({
        from: `"DSA Tracker" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `DSA Reminder: ${problems.length} problem(s) need review`,
        html: buildEmailHtml(problems),
      });

      await prisma.problem.updateMany({
        where: {
          userId: user.id,
          id: { in: problems.map((problem) => problem.id) },
        },
        data: {
          reminderSent: true,
          lastRemindedAt: new Date(),
        },
      });

      sent += problems.length;
    } catch (error) {
      console.error(`Reminder failed for ${user.email}:`, error.message);
      failures.push(user.email);
    }
  }

  return { sent, failedUsers: failures };
}

function startCronJob() {
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily DSA reminders');

    try {
      const result = await sendReminders();
      console.log('Reminder result:', result);
    } catch (error) {
      console.error('Reminder cron failed:', error);
    }
  });

  console.log('Daily reminder scheduled for 9:00 AM server time');
}

module.exports = { sendReminders, startCronJob };
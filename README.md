# DSA Problem Tracker

A personal full-stack DSA revision tracker with email reminders.

**Stack**: React + Vite + Tailwind CSS (frontend) · Node.js + Express + Prisma + PostgreSQL (backend) · node-cron + nodemailer (reminders)

---

## Project Structure

```
dsa-tracker/
├── backend/         # Express API + Prisma + cron job
└── frontend/        # React + Vite + Tailwind
```

---

## Prerequisites

- Node.js 18+
- PostgreSQL running locally (or Docker)
- A Gmail account with an App Password

---

## 1. PostgreSQL Setup

**Option A — local install (macOS):**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb dsa_tracker
```

**Option B — Docker (easiest):**
```bash
docker run --name dsa-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=dsa_tracker \
  -p 5432:5432 \
  -d postgres:15
```

---

## 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your .env values (see below)
npm install
npx prisma migrate dev --name init
npm run dev
```

Backend runs on **http://localhost:3001**

### Environment Variables (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | `postgresql://USER:PASSWORD@localhost:5432/dsa_tracker` |
| `EMAIL_USER` | Your Gmail address, e.g. `you@gmail.com` |
| `EMAIL_APP_PASSWORD` | 16-character Gmail App Password (see below) |
| `MY_EMAIL` | Recipient email for reminders (can be same as EMAIL_USER) |
| `PORT` | API port, default `3001` |

---

## 3. Generating a Gmail App Password

> You need this so the app can send emails on your behalf **without** using your real password.

1. Go to your Google Account → **Security**
2. Enable **2-Step Verification** (required)
3. Search for **"App passwords"** in the search bar
4. Select **App** → "Mail" and **Device** → "Other (Custom name)" → type "DSA Tracker"
5. Click **Generate** → copy the 16-character password
6. Paste it as `EMAIL_APP_PASSWORD` in your `.env`

---

## 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**  
API calls are proxied to backend automatically via Vite config.

---

## 5. API Reference

| Method | Route | Description |
|---|---|---|
| GET | `/api/problems?topic=&status=` | List problems (filter optional) |
| GET | `/api/problems/stats` | Dashboard stats |
| POST | `/api/problems` | Create problem |
| PUT | `/api/problems/:id` | Update problem |
| DELETE | `/api/problems/:id` | Delete problem |
| GET | `/api/topics` | List all topics |
| POST | `/api/topics` | Add custom topic |
| POST | `/api/reminders/trigger` | Manually trigger reminder email |

---

## 6. Running Both Together

Open two terminals:

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Reminder Logic

- Cron runs **daily at 9:00 AM**
- Sends email for problems where: `status != 'solved'` AND `createdAt >= 5 days ago` AND `reminderSent == false`
- After sending, marks `reminderSent = true` and records `lastRemindedAt`
- Use the **"Send Reminders Now"** button on the Dashboard to test manually

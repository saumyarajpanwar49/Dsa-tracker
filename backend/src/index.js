require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { authenticate, requireAdmin } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const authRouter = require('./routes/auth');
const problemsRouter = require('./routes/problems');
const topicsRouter = require('./routes/topics');
const remindersRouter = require('./routes/reminders');
const adminRouter = require('./routes/admin');

const { startCronJob } = require('./services/reminderService');

const app = express();
const PORT = process.env.PORT || 3001;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and contain at least 32 characters');
}

app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, authRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/problems', authenticate, problemsRouter);
app.use('/api/topics', authenticate, topicsRouter);
app.use('/api/reminders', authenticate, remindersRouter);
app.use('/api/admin', authenticate, requireAdmin, adminRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);

  if (process.env.ENABLE_REMINDER_CRON !== 'false') {
    startCronJob();
  }
});
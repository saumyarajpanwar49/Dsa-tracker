require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const {
  authenticate,
  requireAdmin,
  requireActiveSubscription,
} = require('./middleware/auth');

const errorHandler = require('./middleware/errorHandler');

const authRouter = require('./routes/auth');
const paymentRouter = require('./routes/payment');
const problemsRouter = require('./routes/problems');
const topicsRouter = require('./routes/topics');
const remindersRouter = require('./routes/reminders');
const adminRouter = require('./routes/admin');
const questionBankRouter = require('./routes/questionBank');
const questionTopicsRouter = require('./routes/questionTopics');
const roadmapRouter = require('./routes/roadmap');
const weaknessRouter = require('./routes/weakness');
const revisionRouter = require('./routes/revision');
const analyticsRouter = require('./routes/analytics');

const { startCronJob } = require('./services/reminderService');

const app = express();
const PORT = process.env.PORT || 3001;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and contain at least 32 characters');
}

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS: ' + origin));
  },
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

// Payment endpoints remain accessible after trial expiry.
app.use('/api/payment', authenticate, paymentRouter);

// DSA features require an active subscription.
app.use('/api/problems', authenticate, requireActiveSubscription, problemsRouter);
app.use('/api/topics', authenticate, requireActiveSubscription, topicsRouter);
app.use('/api/reminders', authenticate, requireActiveSubscription, remindersRouter);
app.use('/api/questions', authenticate, requireActiveSubscription, questionBankRouter);
app.use('/api/question-topics', authenticate, requireActiveSubscription, questionTopicsRouter);
app.use('/api/roadmap', authenticate, requireActiveSubscription, roadmapRouter);
app.use('/api/weakness', authenticate, requireActiveSubscription, weaknessRouter);
app.use('/api/revision', authenticate, requireActiveSubscription, revisionRouter);
app.use('/api/analytics', authenticate, requireActiveSubscription, analyticsRouter);

// Admin routes remain accessible independently of subscription status.
app.use('/api/admin', authenticate, requireAdmin, adminRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log('Allowed frontend origins:', allowedOrigins);

  if (process.env.ENABLE_REMINDER_CRON !== 'false') {
    startCronJob();
  }
});
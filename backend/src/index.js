require('dotenv').config();
const express = require('express');
const cors = require('cors');

const problemsRouter = require('./routes/problems');
const topicsRouter = require('./routes/topics');
const remindersRouter = require('./routes/reminders');
const errorHandler = require('./middleware/errorHandler');
const { startCronJob } = require('./services/reminderService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/problems', problemsRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/reminders', remindersRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  startCronJob();
});

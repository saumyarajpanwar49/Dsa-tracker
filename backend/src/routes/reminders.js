const express = require('express');
const { sendReminders } = require('../services/reminderService');

const router = express.Router();

// POST /api/reminders/trigger — manual trigger for testing
router.post('/trigger', async (req, res, next) => {
  try {
    const result = await sendReminders();
    res.json({ message: 'Reminders processed', ...result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

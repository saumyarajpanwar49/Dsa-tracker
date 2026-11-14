const express = require('express');
const { sendReminders } = require('../services/reminderService');

const router = express.Router();

router.post('/trigger', async (req, res, next) => {
  try {
    const result = await sendReminders(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
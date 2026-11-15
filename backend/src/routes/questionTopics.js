const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/question-topics/summary
// Returns topic-wise question and user progress counts.
router.get('/summary', async (req, res, next) => {
  try {
    const questions = await prisma.question.findMany({
      where: { isActive: true },
      select: {
        topic: true,
        tags: true,
        progress: {
          where: { userId: req.user.id },
          select: {
            status: true,
          },
        },
      },
    });

    const topicMap = new Map();

    for (const question of questions) {
      const questionTopics = new Map();

      if (question.topic) {
        questionTopics.set(
          question.topic.trim().toLowerCase(),
          question.topic.trim()
        );
      }

      for (const tag of question.tags || []) {
        if (tag && tag.trim()) {
          questionTopics.set(tag.trim().toLowerCase(), tag.trim());
        }
      }

      const status = question.progress[0]?.status || 'todo';

      for (const [key, name] of questionTopics) {
        if (!topicMap.has(key)) {
          topicMap.set(key, {
            name,
            total: 0,
            solved: 0,
            attempted: 0,
          });
        }

        const item = topicMap.get(key);

        item.total += 1;

        if (status === 'solved') {
          item.solved += 1;
        }

        if (status === 'attempted') {
          item.attempted += 1;
        }
      }
    }

    const topics = [...topicMap.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    res.json({
      totalTopics: topics.length,
      totalQuestions: questions.length,
      topics,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

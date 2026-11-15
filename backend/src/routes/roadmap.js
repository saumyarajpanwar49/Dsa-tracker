const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

const VALID_ROADMAP_STATUSES = ['locked', 'active', 'completed'];
const MIN_SOLVED_QUESTIONS = 20;
const MIN_SUCCESS_RATE = 70;

function getRequiredSolved(total) {
  return Math.min(MIN_SOLVED_QUESTIONS, total);
}

function canCompleteTopic(item) {
  return (
    item.total > 0 &&
    item.solved >= getRequiredSolved(item.total) &&
    item.successRate >= MIN_SUCCESS_RATE
  );
}

async function getTopicAnalysis(userId) {
  const questions = await prisma.question.findMany({
    where: { isActive: true },
    select: {
      id: true,
      topic: true,
      pattern: true,
      progress: {
        where: { userId },
        select: {
          status: true,
          attempts: true,
          successfulAttempts: true,
        },
      },
    },
  });

  const topics = new Map();

  for (const question of questions) {
    const topic = question.topic || 'Other';

    if (!topics.has(topic)) {
      topics.set(topic, {
        topic,
        total: 0,
        attempted: 0,
        solved: 0,
        attempts: 0,
        successfulAttempts: 0,
        patterns: new Map(),
      });
    }

    const item = topics.get(topic);
    const progress = question.progress[0];

    item.total += 1;

    if (progress) {
      item.attempted += progress.attempts > 0 ? 1 : 0;
      item.solved += progress.status === 'solved' ? 1 : 0;
      item.attempts += progress.attempts;
      item.successfulAttempts += progress.successfulAttempts;
    }

    const pattern = question.pattern || 'General';

    if (!item.patterns.has(pattern)) {
      item.patterns.set(pattern, {
        pattern,
        total: 0,
        attempted: 0,
        solved: 0,
      });
    }

    const patternItem = item.patterns.get(pattern);
    patternItem.total += 1;

    if (progress) {
      patternItem.attempted += progress.attempts > 0 ? 1 : 0;
      patternItem.solved += progress.status === 'solved' ? 1 : 0;
    }
  }

  return [...topics.values()].map((item) => {
    const completionRate =
      item.total > 0 ? (item.solved / item.total) * 100 : 0;

    const successRate =
      item.attempts > 0
        ? (item.successfulAttempts / item.attempts) * 100
        : 0;

    const patterns = [...item.patterns.values()].map((pattern) => ({
      ...pattern,
      completionRate:
        pattern.total > 0
          ? Number(((pattern.solved / pattern.total) * 100).toFixed(1))
          : 0,
    }));

    const result = {
      topic: item.topic,
      total: item.total,
      attempted: item.attempted,
      solved: item.solved,
      completionRate: Number(completionRate.toFixed(1)),
      successRate: Number(successRate.toFixed(1)),
      patterns,
    };

    return {
      ...result,
      requiredSolved: getRequiredSolved(item.total),
      eligibleForCompletion: canCompleteTopic(result),
    };
  });
}

// GET /api/roadmap
router.get('/', async (req, res, next) => {
  try {
    const [roadmap, analysis] = await Promise.all([
      prisma.userRoadmap.findMany({
        where: { userId: req.user.id },
        orderBy: { position: 'asc' },
      }),
      getTopicAnalysis(req.user.id),
    ]);

    const recommendations = analysis
      .filter((item) => item.solved < item.total)
      .sort((a, b) => {
        if (a.completionRate !== b.completionRate) {
          return a.completionRate - b.completionRate;
        }

        return b.total - a.total;
      })
      .slice(0, 5);

    res.json({ roadmap, analysis, recommendations });
  } catch (error) {
    next(error);
  }
});

// POST /api/roadmap/generate
router.post('/generate', async (req, res, next) => {
  try {
    const analysis = await getTopicAnalysis(req.user.id);

    if (analysis.length === 0) {
      return res.status(404).json({
        error: 'No active questions found',
      });
    }

    const orderedTopics = [...analysis].sort((a, b) => {
      const aCompleted = canCompleteTopic(a);
      const bCompleted = canCompleteTopic(b);

      if (aCompleted !== bCompleted) {
        return aCompleted ? -1 : 1;
      }

      if (a.completionRate !== b.completionRate) {
        return a.completionRate - b.completionRate;
      }

      const aPriority = a.attempted === 0 ? -1 : a.successRate;
      const bPriority = b.attempted === 0 ? -1 : b.successRate;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return b.total - a.total;
    });

    let firstIncompleteAssigned = false;

    const data = orderedTopics.map((item, index) => {
      const isCompleted = canCompleteTopic(item);

      let status;

      if (isCompleted) {
        status = 'completed';
      } else if (!firstIncompleteAssigned) {
        status = 'active';
        firstIncompleteAssigned = true;
      } else {
        status = 'locked';
      }

      const weakestPattern = [...item.patterns].sort(
        (a, b) => a.completionRate - b.completionRate
      )[0];

      return {
        userId: req.user.id,
        topic: item.topic,
        pattern: weakestPattern?.pattern || null,
        position: index + 1,
        status,
        completedAt: isCompleted ? new Date() : null,
      };
    });

    const roadmap = await prisma.$transaction(async (tx) => {
      await tx.userRoadmap.deleteMany({
        where: { userId: req.user.id },
      });

      await tx.userRoadmap.createMany({ data });

      return tx.userRoadmap.findMany({
        where: { userId: req.user.id },
        orderBy: { position: 'asc' },
      });
    });

    res.json({
      message: 'Smart Roadmap generated successfully',
      roadmap,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/roadmap/:id/status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!VALID_ROADMAP_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${VALID_ROADMAP_STATUSES.join(', ')}`,
      });
    }

    const existing = await prisma.userRoadmap.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        error: 'Roadmap item not found',
      });
    }

    if (existing.status === 'completed' && status !== 'completed') {
      return res.status(400).json({
        error: 'A completed topic cannot be reopened from this action',
      });
    }

    if (status === 'completed') {
      if (existing.status !== 'active') {
        return res.status(400).json({
          error: 'Only the active topic can be marked as completed',
        });
      }

      const analysis = await getTopicAnalysis(req.user.id);
      const topicAnalysis = analysis.find(
        (item) => item.topic === existing.topic
      );

      if (!topicAnalysis || !canCompleteTopic(topicAnalysis)) {
        const totalQuestions = topicAnalysis?.total || 0;
        const solvedQuestions = topicAnalysis?.solved || 0;
        const requiredSolved = topicAnalysis
          ? getRequiredSolved(totalQuestions)
          : MIN_SOLVED_QUESTIONS;
        const successRate = topicAnalysis?.successRate || 0;

        return res.status(400).json({
          error:
            `Completion requirements not met for ${existing.topic}. ` +
            `Solve at least ${requiredSolved} questions and maintain ` +
            `a ${MIN_SUCCESS_RATE}% success rate. ` +
            `Current progress: ${solvedQuestions}/${totalQuestions} solved, ` +
            `${successRate}% success rate.`,
          totalQuestions,
          solvedQuestions,
          requiredSolved,
          successRate,
          requiredSuccessRate: MIN_SUCCESS_RATE,
          remainingQuestions: Math.max(0, requiredSolved - solvedQuestions),
        });
      }
    }

    if (status === 'active' && existing.status === 'locked') {
      if (existing.position > 1) {
        const previousItem = await prisma.userRoadmap.findFirst({
          where: {
            userId: req.user.id,
            position: existing.position - 1,
          },
        });

        if (!previousItem || previousItem.status !== 'completed') {
          return res.status(400).json({
            error: 'Complete the previous topic before unlocking this one',
          });
        }
      }

      const anotherActive = await prisma.userRoadmap.findFirst({
        where: {
          userId: req.user.id,
          status: 'active',
          id: { not: existing.id },
        },
      });

      if (anotherActive) {
        return res.status(400).json({
          error: 'Finish the currently active topic first',
        });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const roadmapItem = await tx.userRoadmap.update({
        where: { id: existing.id },
        data: {
          status,
          completedAt: status === 'completed' ? new Date() : null,
        },
      });

      if (status === 'completed') {
        const nextItem = await tx.userRoadmap.findFirst({
          where: {
            userId: req.user.id,
            position: existing.position + 1,
            status: 'locked',
          },
        });

        if (nextItem) {
          await tx.userRoadmap.update({
            where: { id: nextItem.id },
            data: { status: 'active' },
          });
        }
      }

      return roadmapItem;
    });

    res.json({
      message: 'Roadmap updated successfully',
      roadmapItem: updated,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

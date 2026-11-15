const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

function calculateWeakness(total, attempted, solved, attempts, successfulAttempts) {
  const completionRate = total > 0 ? (solved / total) * 100 : 0;
  const coverageRate = total > 0 ? (attempted / total) * 100 : 0;

  const successRate =
    attempts > 0 ? (successfulAttempts / attempts) * 100 : 0;

  const unattempted = Math.max(0, total - attempted);

  let level = 'Strong';

  if (attempted === 0) {
    level = 'Not Started';
  } else if (attempts < 5) {
    // Too little data to classify a topic as weak.
    level = 'Improving';
  } else if (successRate < 40) {
    level = 'Critical';
  } else if (successRate < 65) {
    level = 'Needs Practice';
  } else if (successRate < 80 || completionRate < 75) {
    level = 'Improving';
  }

  return {
    total,
    attempted,
    solved,
    unattempted,
    completionRate: Number(completionRate.toFixed(1)),
    coverageRate: Number(coverageRate.toFixed(1)),
    successRate: Number(successRate.toFixed(1)),
    totalAttempts: attempts,
    level,
  };
}

async function analyzeQuestions(userId) {
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

  const topicMap = new Map();
  const patternMap = new Map();

  for (const question of questions) {
    const progress = question.progress[0];

    const topic = question.topic || 'Other';
    const pattern = question.pattern || 'General';

    if (!topicMap.has(topic)) {
      topicMap.set(topic, {
        name: topic,
        total: 0,
        attempted: 0,
        solved: 0,
        attempts: 0,
        successfulAttempts: 0,
      });
    }

    if (!patternMap.has(pattern)) {
      patternMap.set(pattern, {
        name: pattern,
        total: 0,
        attempted: 0,
        solved: 0,
        attempts: 0,
        successfulAttempts: 0,
      });
    }

    const topicData = topicMap.get(topic);
    const patternData = patternMap.get(pattern);

    topicData.total += 1;
    patternData.total += 1;

    if (progress) {
      const hasAttempted = progress.attempts > 0;
      const isSolved = progress.status === 'solved';

      for (const data of [topicData, patternData]) {
        if (hasAttempted) data.attempted += 1;
        if (isSolved) data.solved += 1;

        data.attempts += progress.attempts;
        data.successfulAttempts += progress.successfulAttempts;
      }
    }
  }

  function formatAnalysis(data) {
    return [...data.values()].map((item) => ({
      name: item.name,
      ...calculateWeakness(
        item.total,
        item.attempted,
        item.solved,
        item.attempts,
        item.successfulAttempts
      ),
    }));
  }

  const topics = formatAnalysis(topicMap);
  const patterns = formatAnalysis(patternMap);

  const priorityOrder = {
    Critical: 0,
    'Needs Practice': 1,
    Improving: 2,
    'Not Started': 3,
    Strong: 4,
  };

  const sortWeakness = (a, b) => {
    const priorityDifference =
      priorityOrder[a.level] - priorityOrder[b.level];

    if (priorityDifference !== 0) return priorityDifference;

    return a.successRate - b.successRate;
  };

  topics.sort(sortWeakness);
  patterns.sort(sortWeakness);

  return {
    topics,
    patterns,
    summary: {
      totalTopics: topics.length,
      weakTopics: topics.filter(
        (item) => ['Critical', 'Needs Practice'].includes(item.level)
      ).length,
      strongTopics: topics.filter(
        (item) => item.level === 'Strong'
      ).length,
      totalPatterns: patterns.length,
      weakPatterns: patterns.filter(
        (item) => ['Critical', 'Needs Practice'].includes(item.level)
      ).length,
    },
  };
}

// GET /api/weakness
router.get('/', async (req, res, next) => {
  try {
    const analysis = await analyzeQuestions(req.user.id);

    res.json({
      message: 'Weakness analysis generated successfully',
      ...analysis,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/weakness/topics
router.get('/topics', async (req, res, next) => {
  try {
    const analysis = await analyzeQuestions(req.user.id);

    res.json({
      topics: analysis.topics,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/weakness/patterns
router.get('/patterns', async (req, res, next) => {
  try {
    const analysis = await analyzeQuestions(req.user.id);

    res.json({
      patterns: analysis.patterns,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

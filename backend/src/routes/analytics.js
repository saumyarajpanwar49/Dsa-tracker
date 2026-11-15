
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

function getIndiaDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return new Date(
    `${values.year}-${values.month}-${values.day}T00:00:00.000Z`
  );
}

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

// GET /api/analytics
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = getIndiaDate();
    const startDate = addDays(today, -29);

    const [
      totalQuestions,
      progressRecords,
      activities,
      dailyGoal,
      goals,
    ] = await Promise.all([
      prisma.question.count({
        where: { isActive: true },
      }),

      prisma.userQuestionProgress.findMany({
        where: { userId },
        select: {
          status: true,
          attempts: true,
          successfulAttempts: true,
          solvedAt: true,
          lastAttemptAt: true,
        },
      }),

      prisma.studyActivity.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: today,
          },
        },
        orderBy: { date: 'asc' },
      }),

      prisma.dailyGoal.findUnique({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
      }),

      prisma.dailyGoal.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: today,
          },
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    const solved = progressRecords.filter(
      (item) => item.status === 'solved'
    ).length;

    const attempted = progressRecords.filter(
      (item) => item.attempts > 0
    ).length;

    const totalAttempts = progressRecords.reduce(
      (sum, item) => sum + item.attempts,
      0
    );

    const successfulAttempts = progressRecords.reduce(
      (sum, item) => sum + item.successfulAttempts,
      0
    );

    const activityByDate = new Map(
      activities.map((item) => [
        dateKey(item.date),
        item,
      ])
    );

    const goalByDate = new Map(
      goals.map((item) => [
        dateKey(item.date),
        item,
      ])
    );

    const dailyActivity = [];

    for (let i = 29; i >= 0; i -= 1) {
      const date = addDays(today, -i);
      const key = dateKey(date);
      const activity = activityByDate.get(key);
      const goal = goalByDate.get(key);

      dailyActivity.push({
        date: key,
        solved: activity?.solvedCount || 0,
        attempted: activity?.attemptedCount || 0,
        studyMinutes: activity?.studyMinutes || 0,
        goalTarget: goal?.target || 0,
        goalCompleted: goal?.completed || 0,
      });
    }

    const activeDates = new Set(
      activities
        .filter(
          (item) =>
            item.solvedCount > 0 ||
            item.attemptedCount > 0 ||
            item.studyMinutes > 0
        )
        .map((item) => dateKey(item.date))
    );

    let currentStreak = 0;
    let streakDate = new Date(today);

    if (!activeDates.has(dateKey(today))) {
      streakDate = addDays(today, -1);
    }

    while (activeDates.has(dateKey(streakDate))) {
      currentStreak += 1;
      streakDate = addDays(streakDate, -1);
    }

    let longestStreak = 0;
    let runningStreak = 0;
    let previousDate = null;

    const sortedDates = [...activeDates].sort();

    for (const key of sortedDates) {
      const currentDate = new Date(`${key}T00:00:00.000Z`);

      if (
        previousDate &&
        currentDate.getTime() - previousDate.getTime() ===
          24 * 60 * 60 * 1000
      ) {
        runningStreak += 1;
      } else {
        runningStreak = 1;
      }

      longestStreak = Math.max(longestStreak, runningStreak);
      previousDate = currentDate;
    }

    const last7Days = dailyActivity.slice(-7);
    const last30Days = dailyActivity;

    const weeklySolved = last7Days.reduce(
      (sum, item) => sum + item.solved,
      0
    );

    const monthlySolved = last30Days.reduce(
      (sum, item) => sum + item.solved,
      0
    );

    const totalStudyMinutes = last30Days.reduce(
      (sum, item) => sum + item.studyMinutes,
      0
    );

    const completionRate =
      totalQuestions > 0
        ? Number(((solved / totalQuestions) * 100).toFixed(1))
        : 0;

    const successRate =
      totalAttempts > 0
        ? Number(
            ((successfulAttempts / totalAttempts) * 100).toFixed(1)
          )
        : 0;

    res.json({
      overview: {
        totalQuestions,
        solved,
        attempted,
        unattempted: Math.max(0, totalQuestions - attempted),
        completionRate,
        totalAttempts,
        successfulAttempts,
        successRate,
      },

      streaks: {
        current: currentStreak,
        longest: longestStreak,
      },

      today: {
        date: dateKey(today),
        solved: dailyGoal?.completed || 0,
        goal: dailyGoal?.target || 0,
        remaining: Math.max(
          0,
          (dailyGoal?.target || 0) - (dailyGoal?.completed || 0)
        ),
      },

      trends: {
        weeklySolved,
        monthlySolved,
        studyMinutesLast30Days: totalStudyMinutes,
      },

      dailyActivity,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/goals
router.get('/goals', async (req, res, next) => {
  try {
    const goals = await prisma.dailyGoal.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        date: 'desc',
      },
      take: 30,
    });

    res.json({ goals });
  } catch (error) {
    next(error);
  }
});

// PUT /api/analytics/goals
router.put('/goals', async (req, res, next) => {
  try {
    const target = Number(req.body.target);

    if (
      !Number.isInteger(target) ||
      target < 1 ||
      target > 500
    ) {
      return res.status(400).json({
        error: 'Daily goal must be a whole number between 1 and 500',
      });
    }

    const today = getIndiaDate();

    const goal = await prisma.dailyGoal.upsert({
      where: {
        userId_date: {
          userId: req.user.id,
          date: today,
        },
      },
      update: {
        target,
      },
      create: {
        userId: req.user.id,
        date: today,
        target,
        completed: 0,
      },
    });

    res.json({
      message: 'Daily goal updated successfully',
      goal,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

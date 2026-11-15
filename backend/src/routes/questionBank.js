const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

const VALID_STATUSES = ['todo', 'attempted', 'solved', 'needs_revision'];
const VALID_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

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

function isSameIndiaDay(date, today) {
  if (!date) return false;

  const dateKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
  }).format(date);

  return dateKey === today.toISOString().slice(0, 10);
}

// GET /api/questions
// Search by title, LeetCode number, topic or pattern.
router.get('/', async (req, res, next) => {
  try {
    const {
      search,
      topic,
      pattern,
      difficulty,
      status,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const where = { isActive: true };
    const conditions = [];

    if (search && String(search).trim()) {
      const searchTerm = String(search).trim();
      const searchNumber = /^\d+$/.test(searchTerm)
        ? Number(searchTerm)
        : null;

      const searchConditions = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { topic: { contains: searchTerm, mode: 'insensitive' } },
        { pattern: { contains: searchTerm, mode: 'insensitive' } },
      ];

      if (searchNumber !== null && Number.isSafeInteger(searchNumber)) {
        searchConditions.push({ leetcodeId: searchNumber });
      }

      conditions.push({ OR: searchConditions });
    }

    if (topic) {
      conditions.push({
        OR: [
          { topic: { equals: topic, mode: 'insensitive' } },
          { tags: { has: topic } },
        ],
      });
    }

    if (pattern) {
      conditions.push({
        pattern: { equals: pattern, mode: 'insensitive' },
      });
    }

    if (difficulty) {
      if (!VALID_DIFFICULTIES.includes(difficulty)) {
        return res.status(400).json({ error: 'Invalid difficulty' });
      }

      conditions.push({ difficulty });
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      conditions.push({
        progress: {
          some: {
            userId: req.user.id,
            status,
          },
        },
      });
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          progress: {
            where: { userId: req.user.id },
            select: {
              status: true,
              attempts: true,
              successfulAttempts: true,
              lastAttemptAt: true,
              solvedAt: true,
              revisitAt: true,
              notes: true,
            },
          },
        },
        orderBy: [
          { sortOrder: 'asc' },
          { title: 'asc' },
        ],
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
      prisma.question.count({ where }),
    ]);

    res.json({
      questions: questions.map((question) => ({
        ...question,
        progress: question.progress[0] || {
          status: 'todo',
          attempts: 0,
          successfulAttempts: 0,
          lastAttemptAt: null,
          solvedAt: null,
          revisitAt: null,
          notes: null,
        },
      })),
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/questions/filters
router.get('/filters', async (req, res, next) => {
  try {
    const questions = await prisma.question.findMany({
      where: { isActive: true },
      select: {
        topic: true,
        pattern: true,
        tags: true,
      },
    });

    const topics = new Set();
    const patterns = new Set();

    questions.forEach((question) => {
      if (question.topic) topics.add(question.topic);
      if (question.pattern) patterns.add(question.pattern);

      (question.tags || []).forEach((tag) => {
        if (tag) topics.add(tag);
      });
    });

    res.json({
      topics: [...topics].sort(),
      patterns: [...patterns].sort(),
      difficulties: VALID_DIFFICULTIES,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/questions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const question = await prisma.question.findFirst({
      where: {
        id: req.params.id,
        isActive: true,
      },
      include: {
        progress: {
          where: { userId: req.user.id },
        },
      },
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({
      ...question,
      progress: question.progress[0] || null,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/questions/:id/progress
router.patch('/:id/progress', async (req, res, next) => {
  try {
    const { status, notes, revisitAt } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    if (
      notes !== undefined &&
      notes !== null &&
      typeof notes !== 'string'
    ) {
      return res.status(400).json({ error: 'Notes must be text' });
    }

    let revisionDate;

    if (revisitAt !== undefined) {
      if (revisitAt === null || revisitAt === '') {
        revisionDate = null;
      } else {
        revisionDate = new Date(revisitAt);

        if (Number.isNaN(revisionDate.getTime())) {
          return res.status(400).json({ error: 'Invalid revision date' });
        }
      }
    }

    const question = await prisma.question.findFirst({
      where: {
        id: req.params.id,
        isActive: true,
      },
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const now = new Date();
    const today = getIndiaDate();

    const progress = await prisma.$transaction(async (tx) => {
      const existing = await tx.userQuestionProgress.findUnique({
        where: {
          userId_questionId: {
            userId: req.user.id,
            questionId: question.id,
          },
        },
      });

      const isNewSolve =
        status === 'solved' && existing?.status !== 'solved';

      // Count a question only once toward the daily goal,
      // even if its status is changed and then solved again today.
      const wasSolvedToday =
        existing?.solvedAt && isSameIndiaDay(existing.solvedAt, today);

      const shouldCountDailySolve = isNewSolve && !wasSolvedToday;

      const createData = {
        userId: req.user.id,
        questionId: question.id,
        status,
        attempts:
          status === 'attempted' || status === 'solved' ? 1 : 0,
        successfulAttempts: status === 'solved' ? 1 : 0,
        lastAttemptAt:
          status === 'attempted' || status === 'solved' ? now : null,
        solvedAt: status === 'solved' ? now : null,
        ...(notes !== undefined ? { notes } : {}),
        ...(revisionDate !== undefined
          ? { revisitAt: revisionDate }
          : {}),
      };

      const updateData = {
        status,

        ...(status === 'attempted'
          ? {
              attempts: { increment: 1 },
              lastAttemptAt: now,
            }
          : {}),

        ...(isNewSolve
          ? {
              attempts: { increment: 1 },
              successfulAttempts: { increment: 1 },
              solvedAt: now,
              lastAttemptAt: now,
            }
          : {}),

        ...(notes !== undefined ? { notes } : {}),

        ...(revisionDate !== undefined
          ? { revisitAt: revisionDate }
          : {}),
      };

      const savedProgress = await tx.userQuestionProgress.upsert({
        where: {
          userId_questionId: {
            userId: req.user.id,
            questionId: question.id,
          },
        },
        create: createData,
        update: updateData,
      });

      if (status === 'attempted' || shouldCountDailySolve) {
        await tx.studyActivity.upsert({
          where: {
            userId_date: {
              userId: req.user.id,
              date: today,
            },
          },
          create: {
            userId: req.user.id,
            date: today,
            attemptedCount: status === 'attempted' ? 1 : 0,
            solvedCount: shouldCountDailySolve ? 1 : 0,
          },
          update: {
            ...(status === 'attempted'
              ? { attemptedCount: { increment: 1 } }
              : {}),
            ...(shouldCountDailySolve
              ? { solvedCount: { increment: 1 } }
              : {}),
          },
        });
      }

      if (shouldCountDailySolve) {
        await tx.dailyGoal.upsert({
          where: {
            userId_date: {
              userId: req.user.id,
              date: today,
            },
          },
          create: {
            userId: req.user.id,
            date: today,
            target: 3,
            completed: 1,
          },
          update: {
            completed: { increment: 1 },
          },
        });
      }

      if (isNewSolve) {
        const revisionDays = [1, 3, 7, 14];

        await tx.revisionSchedule.createMany({
          data: revisionDays.map((days) => {
            const dueAt = new Date(today);
            dueAt.setUTCDate(dueAt.getUTCDate() + days);

            return {
              userId: req.user.id,
              questionId: question.id,
              dueAt,
            };
          }),
          skipDuplicates: true,
        });
      }

      if (status === 'needs_revision') {
        const dueAt = new Date(today);
        dueAt.setUTCDate(dueAt.getUTCDate() + 1);

        await tx.revisionSchedule.createMany({
          data: [
            {
              userId: req.user.id,
              questionId: question.id,
              dueAt,
            },
          ],
          skipDuplicates: true,
        });
      }

      return savedProgress;
    });

    res.json({
      message: 'Question progress and study activity updated successfully',
      progress,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

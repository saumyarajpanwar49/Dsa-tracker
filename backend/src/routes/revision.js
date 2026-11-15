
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

function parseDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
}

// GET /api/revision
// Get overdue, due today and upcoming revisions.
router.get('/', async (req, res, next) => {
  try {
    const today = getIndiaDate();

    const schedules = await prisma.revisionSchedule.findMany({
      where: {
        userId: req.user.id,
        completed: false,
      },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            slug: true,
            url: true,
            difficulty: true,
            topic: true,
            pattern: true,
            tags: true,
          },
        },
      },
      orderBy: {
        dueAt: 'asc',
      },
    });

    const overdue = schedules.filter(
      (item) => item.dueAt < today
    );

    const dueToday = schedules.filter(
      (item) => item.dueAt.getTime() === today.getTime()
    );

    const upcoming = schedules.filter(
      (item) => item.dueAt > today
    );

    res.json({
      summary: {
        overdue: overdue.length,
        dueToday: dueToday.length,
        upcoming: upcoming.length,
        totalPending: schedules.length,
      },
      overdue,
      dueToday,
      upcoming,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/revision/history
// Get completed revision history.
router.get('/history', async (req, res, next) => {
  try {
    const history = await prisma.revisionSchedule.findMany({
      where: {
        userId: req.user.id,
        completed: true,
      },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            slug: true,
            url: true,
            difficulty: true,
            topic: true,
            pattern: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 100,
    });

    res.json({
      history,
      total: history.length,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/revision/:questionId/schedule
// Manually schedule a question for revision.
router.post('/:questionId/schedule', async (req, res, next) => {
  try {
    const { dueAt } = req.body;
    const revisionDate = parseDateOnly(dueAt);

    if (!revisionDate) {
      return res.status(400).json({
        error: 'Provide a valid dueAt date in YYYY-MM-DD format',
      });
    }

    const question = await prisma.question.findFirst({
      where: {
        id: req.params.questionId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!question) {
      return res.status(404).json({
        error: 'Question not found',
      });
    }

    const existing = await prisma.revisionSchedule.findUnique({
      where: {
        userId_questionId_dueAt: {
          userId: req.user.id,
          questionId: question.id,
          dueAt: revisionDate,
        },
      },
    });

    if (existing) {
      if (existing.completed) {
        const reopened = await prisma.revisionSchedule.update({
          where: { id: existing.id },
          data: {
            completed: false,
            completedAt: null,
          },
        });

        return res.json({
          message: 'Revision rescheduled successfully',
          revision: reopened,
        });
      }

      return res.status(409).json({
        error: 'This question is already scheduled for that date',
      });
    }

    const revision = await prisma.revisionSchedule.create({
      data: {
        userId: req.user.id,
        questionId: question.id,
        dueAt: revisionDate,
      },
    });

    res.status(201).json({
      message: 'Revision scheduled successfully',
      revision,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/revision/:id/complete
// Mark a revision as completed.
router.patch('/:id/complete', async (req, res, next) => {
  try {
    const revision = await prisma.revisionSchedule.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!revision) {
      return res.status(404).json({
        error: 'Revision not found',
      });
    }

    if (revision.completed) {
      return res.json({
        message: 'Revision was already completed',
        revision,
      });
    }

    const updated = await prisma.revisionSchedule.update({
      where: {
        id: revision.id,
      },
      data: {
        completed: true,
        completedAt: new Date(),
      },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            topic: true,
            pattern: true,
          },
        },
      },
    });

    res.json({
      message: 'Revision completed successfully',
      revision: updated,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

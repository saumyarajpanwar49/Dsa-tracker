const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

const problemInclude = {
  revisionNotes: { orderBy: { createdAt: 'desc' } },
};

router.get('/', async (req, res, next) => {
  try {
    const { topic, status } = req.query;

    const where = { userId: req.user.id };
    if (topic) where.topic = topic;
    if (status) where.status = status;

    const problems = await prisma.problem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: problemInclude,
    });

    res.json(problems);
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [total, solved, revisiting, unsolved, problems] =
      await Promise.all([
        prisma.problem.count({ where: { userId } }),
        prisma.problem.count({ where: { userId, status: 'solved' } }),
        prisma.problem.count({ where: { userId, status: 'revisiting' } }),
        prisma.problem.count({ where: { userId, status: 'unsolved' } }),
        prisma.problem.findMany({
          where: { userId },
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    const uniqueDays = [
      ...new Set(
        problems.map((problem) =>
          problem.createdAt.toISOString().split('T')[0]
        )
      ),
    ].sort((a, b) => b.localeCompare(a));

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let current = today;

    for (const day of uniqueDays) {
      if (day !== current) break;

      streak++;
      const previous = new Date(`${current}T00:00:00.000Z`);
      previous.setUTCDate(previous.getUTCDate() - 1);
      current = previous.toISOString().split('T')[0];
    }

    res.json({ total, solved, revisiting, unsolved, streak });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, link, approach, topic, status, priority } = req.body;

    if (
      ![name, link, approach, topic].every(
        (value) => typeof value === 'string' && value.trim()
      )
    ) {
      return res.status(400).json({
        error: 'name, link, approach, and topic are required',
      });
    }

    if (
      status !== undefined &&
      !['unsolved', 'solved', 'revisiting'].includes(status)
    ) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (
      priority !== undefined &&
      !['high', 'medium', 'low'].includes(priority)
    ) {
      return res.status(400).json({ error: 'Invalid priority' });
    }

    const problem = await prisma.problem.create({
      data: {
        userId: req.user.id,
        name: name.trim(),
        link: link.trim(),
        approach: approach.trim(),
        topic: topic.trim(),
        status: status || 'unsolved',
        priority: priority || 'medium',
      },
      include: problemInclude,
    });

    res.status(201).json(problem);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, link, approach, topic, status, priority } = req.body;

    const existing = await prisma.problem.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    if (
      status !== undefined &&
      !['unsolved', 'solved', 'revisiting'].includes(status)
    ) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (
      priority !== undefined &&
      !['high', 'medium', 'low'].includes(priority)
    ) {
      return res.status(400).json({ error: 'Invalid priority' });
    }

    const updated = await prisma.problem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(link !== undefined && { link }),
        ...(approach !== undefined && { approach }),
        ...(topic !== undefined && { topic }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
      },
      include: problemInclude,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await prisma.problem.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!result.count) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/notes', async (req, res, next) => {
  try {
    const problem = await prisma.problem.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const notes = await prisma.revisionNote.findMany({
      where: { problemId: problem.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(notes);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/notes', async (req, res, next) => {
  try {
    const { note } = req.body;

    if (typeof note !== 'string' || !note.trim()) {
      return res.status(400).json({ error: 'Note is required' });
    }

    const problem = await prisma.problem.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const created = await prisma.$transaction(async (tx) => {
      const revision = await tx.revisionNote.create({
        data: {
          problemId: problem.id,
          note: note.trim(),
        },
      });

      if (problem.status === 'solved') {
        await tx.problem.update({
          where: { id: problem.id },
          data: { status: 'revisiting' },
        });
      }

      return revision;
    });

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.delete('/:problemId/notes/:noteId', async (req, res, next) => {
  try {
    const result = await prisma.revisionNote.deleteMany({
      where: {
        id: req.params.noteId,
        problemId: req.params.problemId,
        problem: { userId: req.user.id },
      },
    });

    if (!result.count) {
      return res.status(404).json({ error: 'Revision note not found' });
    }

    res.json({ message: 'Note deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
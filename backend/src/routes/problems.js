const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/problems?topic=&status=
router.get('/', async (req, res, next) => {
  try {
    const { topic, status } = req.query;
    const where = {};
    if (topic) where.topic = topic;
    if (status) where.status = status;

    const problems = await prisma.problem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        revisionNotes: { orderBy: { createdAt: 'desc' } },
      },
    });
    res.json(problems);
  } catch (err) {
    next(err);
  }
});

// GET /api/problems/stats
router.get('/stats', async (req, res, next) => {
  try {
    const total = await prisma.problem.count();
    const solved = await prisma.problem.count({ where: { status: 'solved' } });
    const revisiting = await prisma.problem.count({ where: { status: 'revisiting' } });
    const unsolved = await prisma.problem.count({ where: { status: 'unsolved' } });

    // Streak: count consecutive days (from today going backward) that have at least one problem
    const problems = await prisma.problem.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const uniqueDays = [
      ...new Set(
        problems.map((p) => p.createdAt.toISOString().split('T')[0])
      ),
    ].sort((a, b) => b.localeCompare(a));

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let current = today;

    for (const day of uniqueDays) {
      if (day === current) {
        streak++;
        const d = new Date(current);
        d.setDate(d.getDate() - 1);
        current = d.toISOString().split('T')[0];
      } else {
        break;
      }
    }

    res.json({ total, solved, revisiting, unsolved, streak });
  } catch (err) {
    next(err);
  }
});

// POST /api/problems
router.post('/', async (req, res, next) => {
  try {
    const { name, link, approach, topic, status, priority } = req.body;
    if (!name || !link || !approach || !topic) {
      return res.status(400).json({ error: 'name, link, approach, and topic are required' });
    }
    const problem = await prisma.problem.create({
      data: {
        name, link, approach, topic,
        status: status || 'unsolved',
        priority: priority || 'medium',
      },
      include: { revisionNotes: true },
    });
    res.status(201).json(problem);
  } catch (err) {
    next(err);
  }
});

// PUT /api/problems/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, link, approach, topic, status, priority } = req.body;

    const existing = await prisma.problem.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Problem not found' });

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
      include: { revisionNotes: { orderBy: { createdAt: 'desc' } } },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/problems/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.problem.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Problem not found' });

    await prisma.problem.delete({ where: { id } });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// ─── Revision Notes ────────────────────────────────────────────────────────

// GET /api/problems/:id/notes
router.get('/:id/notes', async (req, res, next) => {
  try {
    const { id } = req.params;
    const notes = await prisma.revisionNote.findMany({
      where: { problemId: id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(notes);
  } catch (err) {
    next(err);
  }
});

// POST /api/problems/:id/notes
router.post('/:id/notes', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'note is required' });
    }

    const problem = await prisma.problem.findUnique({ where: { id } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    // Auto-set status to revisiting when a note is added
    const created = await prisma.revisionNote.create({
      data: { problemId: id, note: note.trim() },
    });

    // Mark problem as revisiting if it was solved
    if (problem.status === 'solved') {
      await prisma.problem.update({
        where: { id },
        data: { status: 'revisiting' },
      });
    }

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/problems/:problemId/notes/:noteId
router.delete('/:problemId/notes/:noteId', async (req, res, next) => {
  try {
    const { noteId } = req.params;
    await prisma.revisionNote.delete({ where: { id: noteId } });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

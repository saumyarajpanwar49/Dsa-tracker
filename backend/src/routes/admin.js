const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/dashboard', async (req, res, next) => {
  try {
    const [totalUsers, activeUsers, totalProblems, solvedProblems, users] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.problem.count(),
        prisma.problem.count({ where: { status: 'solved' } }),
        prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            trialStartedAt: true,
            accessExpiresAt: true,
            hasPermanentAccess: true,
            createdAt: true,
            _count: { select: { problems: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    res.json({
      totalUsers,
      activeUsers,
      totalProblems,
      solvedProblems,
      users,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        trialStartedAt: true,
        accessExpiresAt: true,
        hasPermanentAccess: true,
        createdAt: true,
        _count: { select: { problems: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        trialStartedAt: true,
        accessExpiresAt: true,
        hasPermanentAccess: true,
        createdAt: true,
        problems: {
          orderBy: { createdAt: 'desc' },
          include: {
            revisionNotes: { orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = {
      total: user.problems.length,
      solved: user.problems.filter((p) => p.status === 'solved').length,
      revisiting: user.problems.filter((p) => p.status === 'revisiting').length,
      unsolved: user.problems.filter((p) => p.status === 'unsolved').length,
    };

    res.json({ user, stats });
  } catch (error) {
    next(error);
  }
});

// Grant or revoke permanent free access.
router.patch('/users/:id/permanent-access', async (req, res, next) => {
  try {
    const { hasPermanentAccess } = req.body;

    if (typeof hasPermanentAccess !== 'boolean') {
      return res.status(400).json({
        error: 'hasPermanentAccess must be true or false',
      });
    }

    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, role: true },
    });

    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (target.role === 'ADMIN') {
      return res.status(400).json({
        error: 'Administrator accounts already have unrestricted access',
      });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { hasPermanentAccess },
      select: {
        id: true,
        name: true,
        email: true,
        hasPermanentAccess: true,
        accessExpiresAt: true,
        trialStartedAt: true,
      },
    });

    res.json({
      message: hasPermanentAccess
        ? 'Permanent free access granted successfully'
        : 'Permanent free access revoked successfully',
      user: updated,
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    if (req.params.id === req.user.id && !isActive) {
      return res.status(400).json({ error: 'You cannot deactivate yourself' });
    }

    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (target.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });

      if (isActive === false && adminCount <= 1) {
        return res.status(400).json({
          error: 'Cannot deactivate the last active administrator',
        });
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    res.json({ user: updated });
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Role must be USER or ADMIN' });
    }

    if (req.params.id === req.user.id && role !== 'ADMIN') {
      return res.status(400).json({
        error: 'You cannot remove your own administrator role',
      });
    }

    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (target.role === 'ADMIN' && role === 'USER') {
      const activeAdmins = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });

      if (target.isActive && activeAdmins <= 1) {
        return res.status(400).json({
          error: 'Cannot demote the last active administrator',
        });
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    res.json({ user: updated });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
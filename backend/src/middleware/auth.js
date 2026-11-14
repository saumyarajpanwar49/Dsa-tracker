const { PrismaClient } = require('@prisma/client');
const {
  verifyToken,
  COOKIE_NAME,
} = require('../utils/authUtils');

const prisma = new PrismaClient();

async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      return res.status(401).json({ error: 'Please log in first' });
    }

    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Account unavailable' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Administrator access required' });
  }

  next();
}

module.exports = { authenticate, requireAdmin };
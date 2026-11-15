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
        trialStartedAt: true,
        accessExpiresAt: true,
        hasPermanentAccess: true,
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

function requireActiveSubscription(req, res, next) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: 'Please log in first' });
  }

  // Administrators always have access.
  if (user.role === 'ADMIN') {
    return next();
  }

  // Permanent access granted by an administrator.
  if (user.hasPermanentAccess) {
    return next();
  }

  const now = new Date();

  // Paid subscription is active.
  if (user.accessExpiresAt && user.accessExpiresAt > now) {
    return next();
  }

  // Existing accounts created before subscription activation
  // retain their access.
  if (!user.trialStartedAt) {
    return next();
  }

  const trialEndsAt = new Date(
    user.trialStartedAt.getTime() + 15 * 60 * 1000
  );

  // New user's 15-minute trial is still active.
  if (now < trialEndsAt) {
    return next();
  }

  return res.status(402).json({
    error: 'Your free trial has expired. Please pay ₹15 to continue.',
    code: 'SUBSCRIPTION_REQUIRED',
    trialEndsAt: trialEndsAt.toISOString(),
    accessExpiresAt: user.accessExpiresAt,
    amount: 15,
    currency: 'INR',
  });
}

module.exports = {
  authenticate,
  requireAdmin,
  requireActiveSubscription,
};
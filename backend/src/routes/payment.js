const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

const AMOUNT_PAISE = 1500;
const CURRENCY = 'INR';

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials are not configured');
  }

  return {
    client: new Razorpay({ key_id: keyId, key_secret: keySecret }),
    keyId,
    keySecret,
  };
}

function addSixMonths(date) {
  const result = new Date(date);
  const day = result.getDate();

  result.setDate(1);
  result.setMonth(result.getMonth() + 6);

  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate();

  result.setDate(Math.min(day, lastDay));
  return result;
}

function getSubscriptionStatus(user) {
  const now = new Date();

  if (user.role === 'ADMIN' || user.hasPermanentAccess) {
    return {
      active: true,
      type: user.role === 'ADMIN' ? 'ADMIN' : 'PERMANENT',
      expiresAt: null,
      trialEndsAt: null,
      remainingTrialSeconds: 0,
    };
  }

  if (user.accessExpiresAt && user.accessExpiresAt > now) {
    return {
      active: true,
      type: 'PAID',
      expiresAt: user.accessExpiresAt,
      trialEndsAt: null,
      remainingTrialSeconds: 0,
    };
  }

  if (!user.trialStartedAt) {
    return {
      active: true,
      type: 'LEGACY',
      expiresAt: null,
      trialEndsAt: null,
      remainingTrialSeconds: 0,
    };
  }

  const trialEndsAt = new Date(
    user.trialStartedAt.getTime() + 15 * 60 * 1000
  );

  const remainingTrialSeconds = Math.max(
    0,
    Math.ceil((trialEndsAt.getTime() - now.getTime()) / 1000)
  );

  return {
    active: now < trialEndsAt,
    type: now < trialEndsAt ? 'TRIAL' : 'EXPIRED',
    expiresAt: null,
    trialEndsAt,
    remainingTrialSeconds,
  };
}

router.get('/status', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        role: true,
        trialStartedAt: true,
        accessExpiresAt: true,
        hasPermanentAccess: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        amountPaise: true,
        currency: true,
        status: true,
        periodStart: true,
        periodEnd: true,
        verifiedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return res.json({
      subscription: getSubscriptionStatus(user),
      amount: AMOUNT_PAISE / 100,
      currency: CURRENCY,
      payments,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/create-order', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        role: true,
        hasPermanentAccess: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'ADMIN' || user.hasPermanentAccess) {
      return res.status(400).json({
        error: 'This account already has permanent access',
      });
    }

    const { client, keyId } = getRazorpay();

    const order = await client.orders.create({
      amount: AMOUNT_PAISE,
      currency: CURRENCY,
      receipt: `sub_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      notes: {
        userId: req.user.id,
        purpose: 'DSA Tracker six-month subscription',
      },
    });

    await prisma.payment.create({
      data: {
        userId: req.user.id,
        razorpayOrderId: order.id,
        amountPaise: AMOUNT_PAISE,
        currency: CURRENCY,
        status: 'PENDING',
      },
    });

    return res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/verify', async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      typeof razorpay_order_id !== 'string' ||
      typeof razorpay_payment_id !== 'string' ||
      typeof razorpay_signature !== 'string' ||
      !razorpay_order_id.trim() ||
      !razorpay_payment_id.trim() ||
      !/^[a-f0-9]{64}$/i.test(razorpay_signature)
    ) {
      return res.status(400).json({
        error: 'Invalid payment verification details',
      });
    }

    const { client, keySecret } = getRazorpay();

    const record = await prisma.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
    });

    if (!record || record.userId !== req.user.id) {
      return res.status(404).json({ error: 'Payment order not found' });
    }

    if (
      record.amountPaise !== AMOUNT_PAISE ||
      record.currency !== CURRENCY
    ) {
      return res.status(400).json({ error: 'Order amount mismatch' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const receivedBuffer = Buffer.from(razorpay_signature, 'hex');

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    if (record.status === 'PAID') {
      if (record.razorpayPaymentId !== razorpay_payment_id) {
        return res.status(409).json({
          error: 'This order was already paid using another payment',
        });
      }

      return res.json({
        success: true,
        message: 'Payment was already verified',
      });
    }

    let gatewayPayment = await client.payments.fetch(
      razorpay_payment_id
    );

    if (
      gatewayPayment.order_id !== razorpay_order_id ||
      gatewayPayment.amount !== record.amountPaise ||
      gatewayPayment.currency !== record.currency
    ) {
      return res.status(400).json({
        error: 'Payment details do not match the order',
      });
    }

    if (gatewayPayment.status === 'authorized') {
      await client.payments.capture(
        razorpay_payment_id,
        record.amountPaise,
        record.currency
      );

      gatewayPayment = await client.payments.fetch(
        razorpay_payment_id
      );
    }

    if (gatewayPayment.status !== 'captured') {
      return res.status(400).json({
        error: 'Payment is not captured. Access has not been activated.',
      });
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      const currentPayment = await tx.payment.findUnique({
        where: { razorpayOrderId: razorpay_order_id },
      });

      if (!currentPayment || currentPayment.userId !== req.user.id) {
        throw new Error('Payment order is unavailable');
      }

      if (currentPayment.status === 'PAID') {
        if (currentPayment.razorpayPaymentId !== razorpay_payment_id) {
          throw new Error('Order already paid with another payment');
        }
        return;
      }

      const currentUser = await tx.user.findUnique({
        where: { id: req.user.id },
        select: { accessExpiresAt: true },
      });

      if (!currentUser) {
        throw new Error('User not found');
      }

      const periodStart =
        currentUser.accessExpiresAt &&
        currentUser.accessExpiresAt > now
          ? currentUser.accessExpiresAt
          : now;

      const periodEnd = addSixMonths(periodStart);

      const updated = await tx.payment.updateMany({
        where: {
          id: currentPayment.id,
          status: 'PENDING',
        },
        data: {
          status: 'PAID',
          razorpayPaymentId: razorpay_payment_id,
          periodStart,
          periodEnd,
          verifiedAt: now,
        },
      });

      if (updated.count !== 1) {
        throw new Error('Payment has already been processed');
      }

      await tx.user.update({
        where: { id: req.user.id },
        data: { accessExpiresAt: periodEnd },
      });
    });

    return res.json({
      success: true,
      message: 'Payment captured and six-month access activated.',
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
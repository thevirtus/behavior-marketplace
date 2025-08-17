const express = require('express');
const { body, validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User, Subscription, Transaction } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Subscription tiers configuration
const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    features: {
      maxPredictions: 5,
      advancedAnalytics: false,
      marketplaceAccess: false,
      apiAccess: false,
      customReports: false
    }
  },
  premium: {
    name: 'Premium',
    price: 29,
    stripePriceId: 'price_premium_monthly', // Replace with actual Stripe price ID
    features: {
      maxPredictions: 50,
      advancedAnalytics: true,
      marketplaceAccess: true,
      apiAccess: false,
      customReports: true
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 999,
    stripePriceId: 'price_enterprise_monthly', // Replace with actual Stripe price ID
    features: {
      maxPredictions: 1000,
      advancedAnalytics: true,
      marketplaceAccess: true,
      apiAccess: true,
      customReports: true
    }
  }
};

// Get subscription tiers
router.get('/tiers', (req, res) => {
  res.json({
    tiers: SUBSCRIPTION_TIERS
  });
});

// Get current subscription
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.user.id }
    });

    if (!subscription) {
      return res.status(404).json({
        error: 'Subscription not found',
        message: 'No subscription found for user'
      });
    }

    res.json({
      subscription: {
        ...subscription.toJSON(),
        tierInfo: SUBSCRIPTION_TIERS[subscription.tier]
      }
    });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    res.status(500).json({
      error: 'Subscription fetch failed',
      message: 'Internal server error'
    });
  }
});

// Create subscription checkout session
router.post('/checkout', [
  authenticateToken,
  body('tier').isIn(['premium', 'enterprise'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { tier } = req.body;
    const tierInfo = SUBSCRIPTION_TIERS[tier];

    if (!tierInfo.stripePriceId) {
      return res.status(400).json({
        error: 'Invalid tier',
        message: 'Tier not available for subscription'
      });
    }

    // Create or get Stripe customer
    let stripeCustomerId = req.user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.getFullName(),
        metadata: {
          userId: req.user.id
        }
      });
      stripeCustomerId = customer.id;
      await req.user.update({ stripeCustomerId });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{
        price: tierInfo.stripePriceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?subscription=cancelled`,
      metadata: {
        userId: req.user.id,
        tier: tier
      }
    });

    res.json({
      checkoutUrl: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({
      error: 'Checkout session creation failed',
      message: 'Internal server error'
    });
  }
});

// Cancel subscription
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.user.id }
    });

    if (!subscription || subscription.tier === 'free') {
      return res.status(400).json({
        error: 'No active subscription',
        message: 'No paid subscription to cancel'
      });
    }

    if (subscription.stripeSubscriptionId) {
      // Cancel at period end to allow user to use remaining time
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      await subscription.update({
        cancelAtPeriodEnd: true
      });
    }

    res.json({
      message: 'Subscription will be cancelled at the end of the current billing period',
      subscription
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({
      error: 'Subscription cancellation failed',
      message: 'Internal server error'
    });
  }
});

// Reactivate subscription
router.post('/reactivate', authenticateToken, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.user.id }
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(400).json({
        error: 'No subscription to reactivate',
        message: 'No active subscription found'
      });
    }

    // Reactivate subscription
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false
    });

    await subscription.update({
      cancelAtPeriodEnd: false,
      status: 'active'
    });

    res.json({
      message: 'Subscription reactivated successfully',
      subscription
    });
  } catch (error) {
    console.error('Subscription reactivation error:', error);
    res.status(500).json({
      error: 'Subscription reactivation failed',
      message: 'Internal server error'
    });
  }
});

// Get billing history
router.get('/billing', authenticateToken, async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: {
        userId: req.user.id,
        type: 'subscription_payment'
      },
      order: [['createdAt', 'DESC']],
      limit: 12 // Last 12 payments
    });

    res.json({
      billingHistory: transactions
    });
  } catch (error) {
    console.error('Billing history error:', error);
    res.status(500).json({
      error: 'Billing history fetch failed',
      message: 'Internal server error'
    });
  }
});

// Update payment method
router.post('/payment-method', [
  authenticateToken,
  body('paymentMethodId').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { paymentMethodId } = req.body;

    if (!req.user.stripeCustomerId) {
      return res.status(400).json({
        error: 'No customer found',
        message: 'Stripe customer not found'
      });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: req.user.stripeCustomerId
    });

    // Set as default payment method
    await stripe.customers.update(req.user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    res.json({
      message: 'Payment method updated successfully'
    });
  } catch (error) {
    console.error('Payment method update error:', error);
    res.status(500).json({
      error: 'Payment method update failed',
      message: 'Internal server error'
    });
  }
});

module.exports = router;

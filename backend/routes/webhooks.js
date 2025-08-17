const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User, Subscription, Transaction } = require('../models');

const router = express.Router();

// Stripe webhook handler
router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

async function handleCheckoutCompleted(session) {
  const userId = session.metadata.userId;
  const tier = session.metadata.tier;

  if (!userId || !tier) {
    console.error('Missing metadata in checkout session');
    return;
  }

  const user = await User.findByPk(userId);
  if (!user) {
    console.error('User not found:', userId);
    return;
  }

  // Update user subscription tier
  await user.update({ subscriptionTier: tier });

  // Update subscription record
  const subscription = await Subscription.findOne({ where: { userId } });
  if (subscription) {
    await subscription.update({
      tier,
      status: 'active',
      stripeSubscriptionId: session.subscription,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
  }

  console.log(`Subscription activated for user ${userId}: ${tier}`);
}

async function handlePaymentSucceeded(invoice) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;
  
  const user = await User.findOne({ where: { stripeCustomerId: customerId } });
  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Create transaction record
  await Transaction.create({
    userId: user.id,
    type: 'subscription_payment',
    amount: invoice.amount_paid / 100, // Convert from cents
    currency: invoice.currency.toUpperCase(),
    status: 'completed',
    stripePaymentIntentId: invoice.payment_intent,
    description: `Subscription payment for ${invoice.lines.data[0]?.description || 'subscription'}`,
    processedAt: new Date()
  });

  // Update subscription status
  const subscription = await Subscription.findOne({ where: { userId: user.id } });
  if (subscription) {
    await subscription.update({
      status: 'active',
      currentPeriodStart: new Date(invoice.period_start * 1000),
      currentPeriodEnd: new Date(invoice.period_end * 1000)
    });
  }

  console.log(`Payment succeeded for user ${user.id}: $${invoice.amount_paid / 100}`);
}

async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;
  
  const user = await User.findOne({ where: { stripeCustomerId: customerId } });
  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Update subscription status
  const subscription = await Subscription.findOne({ where: { userId: user.id } });
  if (subscription) {
    await subscription.update({ status: 'past_due' });
  }

  console.log(`Payment failed for user ${user.id}`);
}

async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer;
  
  const user = await User.findOne({ where: { stripeCustomerId: customerId } });
  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  const userSubscription = await Subscription.findOne({ where: { userId: user.id } });
  if (userSubscription) {
    await userSubscription.update({
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    });
  }

  console.log(`Subscription updated for user ${user.id}: ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;
  
  const user = await User.findOne({ where: { stripeCustomerId: customerId } });
  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Downgrade to free tier
  await user.update({ subscriptionTier: 'free' });

  const userSubscription = await Subscription.findOne({ where: { userId: user.id } });
  if (userSubscription) {
    await userSubscription.update({
      tier: 'free',
      status: 'canceled',
      stripeSubscriptionId: null
    });
  }

  console.log(`Subscription cancelled for user ${user.id}`);
}

module.exports = router;

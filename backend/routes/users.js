const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, BehaviorLog, Prediction, Transaction } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get recent behavior logs
    const recentBehaviors = await BehaviorLog.findAll({
      where: { userId },
      order: [['timestamp', 'DESC']],
      limit: 10
    });

    // Get recent predictions
    const recentPredictions = await Prediction.findAll({
      where: { userId },
      order: [['targetDate', 'DESC']],
      limit: 5
    });

    // Get transaction summary
    const transactions = await Transaction.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Calculate stats
    const totalBehaviors = await BehaviorLog.count({ where: { userId } });
    const totalPredictions = await Prediction.count({ where: { userId } });
    const totalEarnings = req.user.totalEarnings || 0;

    res.json({
      stats: {
        totalBehaviors,
        totalPredictions,
        totalEarnings,
        subscriptionTier: req.user.subscriptionTier
      },
      recentBehaviors,
      recentPredictions,
      transactions
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      error: 'Dashboard fetch failed',
      message: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', [
  authenticateToken,
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('demographics').optional().isObject(),
  body('preferences').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { firstName, lastName, demographics, preferences } = req.body;
    const updateData = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (demographics) updateData.demographics = demographics;
    if (preferences) updateData.preferences = preferences;

    await req.user.update(updateData);

    res.json({
      message: 'Profile updated successfully',
      user: req.user.toJSON()
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Profile update failed',
      message: 'Internal server error'
    });
  }
});

// Get user earnings history
router.get('/earnings', authenticateToken, async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { 
        userId: req.user.id,
        type: 'user_earning',
        status: 'completed'
      },
      order: [['createdAt', 'DESC']]
    });

    const totalEarnings = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    res.json({
      totalEarnings,
      transactions
    });
  } catch (error) {
    console.error('Earnings fetch error:', error);
    res.status(500).json({
      error: 'Earnings fetch failed',
      message: 'Internal server error'
    });
  }
});

module.exports = router;

const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { User, BehaviorLog, Prediction, Transaction, Company } = require('../models');
const { authenticateToken, requireRole, requireSubscription } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Get aggregated insights for companies
router.get('/insights', [
  authenticateToken,
  requireRole(['company', 'admin']),
  query('demographic').optional().isString(),
  query('category').optional().isString(),
  query('timeframe').optional().isIn(['7_days', '30_days', '90_days'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { demographic, category, timeframe = '30_days' } = req.query;
    
    // Calculate date range
    const daysBack = timeframe === '7_days' ? 7 : timeframe === '30_days' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Build where clause for behavior logs
    const whereClause = {
      timestamp: { [Op.gte]: startDate }
    };
    if (category) whereClause.category = category;

    // Get aggregated behavior data
    const behaviorStats = await BehaviorLog.findAll({
      where: whereClause,
      attributes: [
        'category',
        [BehaviorLog.sequelize.fn('COUNT', BehaviorLog.sequelize.col('id')), 'count'],
        [BehaviorLog.sequelize.fn('AVG', BehaviorLog.sequelize.col('value')), 'avgValue'],
        [BehaviorLog.sequelize.fn('SUM', BehaviorLog.sequelize.col('value')), 'totalValue']
      ],
      group: ['category'],
      raw: true
    });

    // Get prediction accuracy stats
    const predictionStats = await Prediction.findAll({
      where: {
        createdAt: { [Op.gte]: startDate },
        accuracy: { [Op.ne]: null }
      },
      attributes: [
        'predictionType',
        [Prediction.sequelize.fn('AVG', Prediction.sequelize.col('accuracy')), 'avgAccuracy'],
        [Prediction.sequelize.fn('COUNT', Prediction.sequelize.col('id')), 'count']
      ],
      group: ['predictionType'],
      raw: true
    });

    // Get demographic insights (anonymized)
    const userStats = await User.findAll({
      attributes: [
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'totalUsers'],
        'subscriptionTier'
      ],
      group: ['subscriptionTier'],
      raw: true
    });

    // Calculate pricing based on data complexity and subscription tier
    const basePrice = behaviorStats.length * 10; // $10 per category
    const premiumMultiplier = req.user.subscriptionTier === 'enterprise' ? 0.8 : 1.0;
    const estimatedPrice = Math.round(basePrice * premiumMultiplier);

    res.json({
      insights: {
        behaviorStats,
        predictionStats,
        userStats,
        timeframe,
        totalDataPoints: behaviorStats.reduce((sum, stat) => sum + parseInt(stat.count), 0)
      },
      pricing: {
        estimatedPrice,
        currency: 'USD',
        dataPoints: behaviorStats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
        subscriptionDiscount: req.user.subscriptionTier === 'enterprise' ? 20 : 0
      },
      metadata: {
        generatedAt: new Date(),
        dataFreshness: timeframe,
        anonymized: true
      }
    });
  } catch (error) {
    console.error('Insights fetch error:', error);
    res.status(500).json({
      error: 'Insights fetch failed',
      message: 'Internal server error'
    });
  }
});

// Purchase insights
router.post('/purchase', [
  authenticateToken,
  requireRole(['company']),
  body('insightType').isString(),
  body('filters').optional().isObject(),
  body('amount').isDecimal({ decimal_digits: '0,2' })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { insightType, filters = {}, amount } = req.body;

    // Create transaction record
    const transaction = await Transaction.create({
      userId: req.user.id,
      companyId: req.user.id, // Assuming company users have companyId same as userId
      type: 'data_purchase',
      amount: parseFloat(amount),
      status: 'completed', // Simplified for MVP - in production, integrate with Stripe
      description: `Purchase of ${insightType} insights`,
      metadata: {
        insightType,
        filters,
        purchaseDate: new Date()
      },
      processedAt: new Date()
    });

    // Calculate user earnings (users get 30% of purchase price)
    const userEarningsRate = 0.30;
    const totalEarnings = parseFloat(amount) * userEarningsRate;

    // Get users whose data contributed to this insight
    const contributingUsers = await User.findAll({
      include: [{
        model: BehaviorLog,
        as: 'behaviorLogs',
        where: filters.category ? { category: filters.category } : {},
        required: true
      }],
      limit: 100 // Limit for performance
    });

    // Distribute earnings among contributing users
    if (contributingUsers.length > 0) {
      const earningsPerUser = totalEarnings / contributingUsers.length;
      
      for (const user of contributingUsers) {
        await Transaction.create({
          userId: user.id,
          type: 'user_earning',
          amount: earningsPerUser,
          status: 'completed',
          description: 'Earnings from data contribution',
          metadata: {
            sourceTransaction: transaction.id,
            insightType
          },
          processedAt: new Date()
        });

        // Update user's total earnings
        await user.increment('totalEarnings', { by: earningsPerUser });
      }
    }

    res.status(201).json({
      message: 'Insights purchased successfully',
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        status: transaction.status,
        insightType,
        contributingUsers: contributingUsers.length
      },
      downloadUrl: `/api/marketplace/download/${transaction.id}` // For future implementation
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({
      error: 'Purchase failed',
      message: 'Internal server error'
    });
  }
});

// Get marketplace transactions
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const whereClause = { userId: req.user.id };
    
    // Companies see their purchases, users see their earnings
    if (req.user.role === 'company') {
      whereClause.type = 'data_purchase';
    } else {
      whereClause.type = 'user_earning';
    }

    const transactions = await Transaction.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    res.json({
      transactions,
      summary: {
        totalAmount,
        totalTransactions: transactions.length,
        currency: 'USD'
      }
    });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    res.status(500).json({
      error: 'Transactions fetch failed',
      message: 'Internal server error'
    });
  }
});

// Get marketplace statistics (public)
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.count({ where: { isActive: true } });
    const totalBehaviors = await BehaviorLog.count();
    const totalPredictions = await Prediction.count();
    const totalTransactions = await Transaction.count({ where: { status: 'completed' } });
    
    const totalVolume = await Transaction.sum('amount', { 
      where: { 
        status: 'completed',
        type: 'data_purchase'
      } 
    });

    res.json({
      stats: {
        totalUsers,
        totalBehaviors,
        totalPredictions,
        totalTransactions,
        totalVolume: totalVolume || 0,
        currency: 'USD'
      },
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({
      error: 'Stats fetch failed',
      message: 'Internal server error'
    });
  }
});

// Get trending insights
router.get('/trending', async (req, res) => {
  try {
    // Get most purchased insight types
    const trendingInsights = await Transaction.findAll({
      where: {
        type: 'data_purchase',
        status: 'completed',
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      attributes: [
        [Transaction.sequelize.json('metadata.insightType'), 'insightType'],
        [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('id')), 'purchaseCount'],
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'totalValue']
      ],
      group: [Transaction.sequelize.json('metadata.insightType')],
      order: [[Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    // Get most active categories
    const activeCategories = await BehaviorLog.findAll({
      where: {
        timestamp: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      attributes: [
        'category',
        [BehaviorLog.sequelize.fn('COUNT', BehaviorLog.sequelize.col('id')), 'activityCount']
      ],
      group: ['category'],
      order: [[BehaviorLog.sequelize.fn('COUNT', BehaviorLog.sequelize.col('id')), 'DESC']],
      limit: 5,
      raw: true
    });

    res.json({
      trending: {
        insights: trendingInsights,
        categories: activeCategories
      },
      period: '7_days'
    });
  } catch (error) {
    console.error('Trending fetch error:', error);
    res.status(500).json({
      error: 'Trending fetch failed',
      message: 'Internal server error'
    });
  }
});

module.exports = router;

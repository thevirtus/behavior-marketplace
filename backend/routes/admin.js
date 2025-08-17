const express = require('express');
const { query, validationResult } = require('express-validator');
const { User, BehaviorLog, Prediction, Transaction, Subscription, Company } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Get admin dashboard stats
router.get('/dashboard', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const [
      totalUsers,
      totalCompanies,
      totalBehaviors,
      totalPredictions,
      totalTransactions,
      activeSubscriptions,
      monthlyRevenue
    ] = await Promise.all([
      User.count({ where: { role: 'user', isActive: true } }),
      User.count({ where: { role: 'company', isActive: true } }),
      BehaviorLog.count(),
      Prediction.count(),
      Transaction.count({ where: { status: 'completed' } }),
      Subscription.count({ where: { status: 'active', tier: { [Op.ne]: 'free' } } }),
      Transaction.sum('amount', {
        where: {
          type: 'subscription_payment',
          status: 'completed',
          createdAt: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    res.json({
      stats: {
        totalUsers,
        totalCompanies,
        totalBehaviors,
        totalPredictions,
        totalTransactions,
        activeSubscriptions,
        monthlyRevenue: monthlyRevenue || 0
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      error: 'Dashboard fetch failed',
      message: 'Internal server error'
    });
  }
});

// Get all users with pagination
router.get('/users', [
  authenticateToken,
  requireRole(['admin']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['user', 'company', 'admin']),
  query('subscriptionTier').optional().isIn(['free', 'premium', 'enterprise'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (req.query.role) whereClause.role = req.query.role;
    if (req.query.subscriptionTier) whereClause.subscriptionTier = req.query.subscriptionTier;

    const users = await User.findAndCountAll({
      where: whereClause,
      include: [{
        model: Subscription,
        as: 'subscription'
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      users: users.rows,
      pagination: {
        total: users.count,
        page,
        limit,
        totalPages: Math.ceil(users.count / limit)
      }
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({
      error: 'Users fetch failed',
      message: 'Internal server error'
    });
  }
});

// Get all transactions
router.get('/transactions', [
  authenticateToken,
  requireRole(['admin']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['data_purchase', 'subscription_payment', 'user_earning', 'marketplace_fee', 'refund']),
  query('status').optional().isIn(['pending', 'completed', 'failed', 'refunded'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (req.query.type) whereClause.type = req.query.type;
    if (req.query.status) whereClause.status = req.query.status;

    const transactions = await Transaction.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      transactions: transactions.rows,
      pagination: {
        total: transactions.count,
        page,
        limit,
        totalPages: Math.ceil(transactions.count / limit)
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

// Get revenue analytics
router.get('/analytics/revenue', [
  authenticateToken,
  requireRole(['admin']),
  query('period').optional().isIn(['7_days', '30_days', '90_days', '1_year'])
], async (req, res) => {
  try {
    const period = req.query.period || '30_days';
    const daysBack = period === '7_days' ? 7 : period === '30_days' ? 30 : period === '90_days' ? 90 : 365;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Revenue by type
    const revenueByType = await Transaction.findAll({
      where: {
        status: 'completed',
        createdAt: { [Op.gte]: startDate }
      },
      attributes: [
        'type',
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total'],
        [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('id')), 'count']
      ],
      group: ['type'],
      raw: true
    });

    // Daily revenue trend
    const dailyRevenue = await Transaction.findAll({
      where: {
        status: 'completed',
        type: { [Op.in]: ['subscription_payment', 'data_purchase'] },
        createdAt: { [Op.gte]: startDate }
      },
      attributes: [
        [Transaction.sequelize.fn('DATE', Transaction.sequelize.col('createdAt')), 'date'],
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'revenue']
      ],
      group: [Transaction.sequelize.fn('DATE', Transaction.sequelize.col('createdAt'))],
      order: [[Transaction.sequelize.fn('DATE', Transaction.sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    res.json({
      analytics: {
        revenueByType,
        dailyRevenue,
        period
      }
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({
      error: 'Revenue analytics fetch failed',
      message: 'Internal server error'
    });
  }
});

// Update user subscription
router.put('/users/:id/subscription', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const { tier } = req.body;
    
    if (!['free', 'premium', 'enterprise'].includes(tier)) {
      return res.status(400).json({
        error: 'Invalid tier',
        message: 'Tier must be free, premium, or enterprise'
      });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    await user.update({ subscriptionTier: tier });
    
    const subscription = await Subscription.findOne({ where: { userId: user.id } });
    if (subscription) {
      await subscription.update({ tier });
    }

    res.json({
      message: 'User subscription updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Subscription update error:', error);
    res.status(500).json({
      error: 'Subscription update failed',
      message: 'Internal server error'
    });
  }
});

// Deactivate user
router.put('/users/:id/deactivate', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    await user.update({ isActive: false });

    res.json({
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('User deactivation error:', error);
    res.status(500).json({
      error: 'User deactivation failed',
      message: 'Internal server error'
    });
  }
});

// Get system health
router.get('/health', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    // Check database connection
    await User.sequelize.authenticate();
    
    // Get recent activity
    const recentUsers = await User.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    const recentBehaviors = await BehaviorLog.count({
      where: {
        timestamp: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    res.json({
      status: 'healthy',
      database: 'connected',
      recentActivity: {
        newUsers: recentUsers,
        newBehaviors: recentBehaviors
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date()
    });
  }
});

module.exports = router;

const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { BehaviorLog } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user behavior logs
router.get('/', [
  authenticateToken,
  query('category').optional().isIn(['purchase', 'app_usage', 'sleep', 'exercise', 'food', 'social', 'work', 'entertainment', 'health', 'travel']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { category, limit = 20, offset = 0 } = req.query;
    const whereClause = { userId: req.user.id };
    
    if (category) {
      whereClause.category = category;
    }

    const behaviors = await BehaviorLog.findAndCountAll({
      where: whereClause,
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      behaviors: behaviors.rows,
      total: behaviors.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Behavior fetch error:', error);
    res.status(500).json({
      error: 'Behavior fetch failed',
      message: 'Internal server error'
    });
  }
});

// Create new behavior log
router.post('/', [
  authenticateToken,
  body('category').isIn(['purchase', 'app_usage', 'sleep', 'exercise', 'food', 'social', 'work', 'entertainment', 'health', 'travel']),
  body('description').trim().isLength({ min: 1, max: 500 }),
  body('subcategory').optional().trim().isLength({ max: 100 }),
  body('value').optional().isDecimal(),
  body('quantity').optional().isInt({ min: 0 }),
  body('duration').optional().isInt({ min: 0 }),
  body('timestamp').optional().isISO8601(),
  body('metadata').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const behaviorData = {
      userId: req.user.id,
      category: req.body.category,
      description: req.body.description,
      subcategory: req.body.subcategory,
      value: req.body.value,
      quantity: req.body.quantity,
      duration: req.body.duration,
      timestamp: req.body.timestamp || new Date(),
      metadata: req.body.metadata || {},
      source: 'manual'
    };

    const behavior = await BehaviorLog.create(behaviorData);

    res.status(201).json({
      message: 'Behavior logged successfully',
      behavior
    });
  } catch (error) {
    console.error('Behavior creation error:', error);
    res.status(500).json({
      error: 'Behavior logging failed',
      message: 'Internal server error'
    });
  }
});

// Update behavior log
router.put('/:id', [
  authenticateToken,
  body('category').optional().isIn(['purchase', 'app_usage', 'sleep', 'exercise', 'food', 'social', 'work', 'entertainment', 'health', 'travel']),
  body('description').optional().trim().isLength({ min: 1, max: 500 }),
  body('subcategory').optional().trim().isLength({ max: 100 }),
  body('value').optional().isDecimal(),
  body('quantity').optional().isInt({ min: 0 }),
  body('duration').optional().isInt({ min: 0 }),
  body('metadata').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const behavior = await BehaviorLog.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!behavior) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Behavior log not found'
      });
    }

    const updateData = {};
    ['category', 'description', 'subcategory', 'value', 'quantity', 'duration', 'metadata'].forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    await behavior.update(updateData);

    res.json({
      message: 'Behavior updated successfully',
      behavior
    });
  } catch (error) {
    console.error('Behavior update error:', error);
    res.status(500).json({
      error: 'Behavior update failed',
      message: 'Internal server error'
    });
  }
});

// Delete behavior log
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const behavior = await BehaviorLog.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!behavior) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Behavior log not found'
      });
    }

    await behavior.destroy();

    res.json({
      message: 'Behavior deleted successfully'
    });
  } catch (error) {
    console.error('Behavior deletion error:', error);
    res.status(500).json({
      error: 'Behavior deletion failed',
      message: 'Internal server error'
    });
  }
});

// Get behavior analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get behavior counts by category
    const categoryStats = await BehaviorLog.findAll({
      where: { userId },
      attributes: [
        'category',
        [BehaviorLog.sequelize.fn('COUNT', BehaviorLog.sequelize.col('id')), 'count']
      ],
      group: ['category']
    });

    // Get recent trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBehaviors = await BehaviorLog.count({
      where: {
        userId,
        timestamp: {
          [BehaviorLog.sequelize.Op.gte]: thirtyDaysAgo
        }
      }
    });

    res.json({
      categoryStats,
      recentBehaviors,
      period: '30_days'
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      error: 'Analytics fetch failed',
      message: 'Internal server error'
    });
  }
});

module.exports = router;

const express = require('express');
const { body, validationResult } = require('express-validator');
const { Prediction, BehaviorLog } = require('../models');
const { authenticateToken, requireSubscription } = require('../middleware/auth');
const predictionService = require('../services/predictionService');

const router = express.Router();

// Get user predictions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const predictions = await Prediction.findAll({
      where: { userId: req.user.id },
      order: [['targetDate', 'DESC']],
      limit: req.user.subscriptionTier === 'free' ? 5 : 50
    });

    res.json({
      predictions,
      subscriptionTier: req.user.subscriptionTier
    });
  } catch (error) {
    console.error('Predictions fetch error:', error);
    res.status(500).json({
      error: 'Predictions fetch failed',
      message: 'Internal server error'
    });
  }
});

// Generate new predictions
router.post('/generate', [
  authenticateToken,
  body('predictionType').isIn(['purchase_likelihood', 'app_usage_duration', 'sleep_quality', 'exercise_frequency', 'decision_pattern', 'behavior_change']),
  body('category').trim().isLength({ min: 1, max: 100 }),
  body('timeframe').optional().isIn(['1_day', '3_days', '1_week', '1_month'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Check subscription limits
    const existingPredictions = await Prediction.count({
      where: { userId: req.user.id }
    });

    const limits = {
      free: 5,
      premium: 50,
      enterprise: 1000
    };

    if (existingPredictions >= limits[req.user.subscriptionTier]) {
      return res.status(403).json({
        error: 'Prediction limit reached',
        message: `Your ${req.user.subscriptionTier} plan allows up to ${limits[req.user.subscriptionTier]} predictions`,
        upgradeRequired: true
      });
    }

    const { predictionType, category, timeframe = '1_day' } = req.body;

    // Get user's behavior data for prediction
    const behaviorData = await BehaviorLog.findAll({
      where: { userId: req.user.id },
      order: [['timestamp', 'DESC']],
      limit: 100
    });

    // Generate prediction using AI service
    const predictionResult = await predictionService.generatePrediction({
      userId: req.user.id,
      predictionType,
      category,
      timeframe,
      behaviorData,
      subscriptionTier: req.user.subscriptionTier
    });

    // Calculate target date
    const targetDate = new Date();
    switch (timeframe) {
      case '1_day':
        targetDate.setDate(targetDate.getDate() + 1);
        break;
      case '3_days':
        targetDate.setDate(targetDate.getDate() + 3);
        break;
      case '1_week':
        targetDate.setDate(targetDate.getDate() + 7);
        break;
      case '1_month':
        targetDate.setMonth(targetDate.getMonth() + 1);
        break;
    }

    // Save prediction
    const prediction = await Prediction.create({
      userId: req.user.id,
      predictionType,
      category,
      prediction: predictionResult.prediction,
      confidence: predictionResult.confidence,
      timeframe,
      targetDate,
      features: predictionResult.features,
      modelVersion: predictionResult.modelVersion
    });

    res.status(201).json({
      message: 'Prediction generated successfully',
      prediction
    });
  } catch (error) {
    console.error('Prediction generation error:', error);
    res.status(500).json({
      error: 'Prediction generation failed',
      message: 'Internal server error'
    });
  }
});

// Get prediction accuracy stats
router.get('/accuracy', authenticateToken, async (req, res) => {
  try {
    const predictions = await Prediction.findAll({
      where: { 
        userId: req.user.id,
        accuracy: { [Prediction.sequelize.Op.ne]: null }
      }
    });

    if (predictions.length === 0) {
      return res.json({
        overallAccuracy: null,
        totalVerified: 0,
        accuracyByType: {}
      });
    }

    const totalAccuracy = predictions.reduce((sum, p) => sum + p.accuracy, 0);
    const overallAccuracy = totalAccuracy / predictions.length;

    // Group by prediction type
    const accuracyByType = {};
    predictions.forEach(p => {
      if (!accuracyByType[p.predictionType]) {
        accuracyByType[p.predictionType] = { total: 0, count: 0 };
      }
      accuracyByType[p.predictionType].total += p.accuracy;
      accuracyByType[p.predictionType].count += 1;
    });

    Object.keys(accuracyByType).forEach(type => {
      accuracyByType[type] = accuracyByType[type].total / accuracyByType[type].count;
    });

    res.json({
      overallAccuracy,
      totalVerified: predictions.length,
      accuracyByType
    });
  } catch (error) {
    console.error('Accuracy fetch error:', error);
    res.status(500).json({
      error: 'Accuracy fetch failed',
      message: 'Internal server error'
    });
  }
});

// Verify prediction outcome
router.post('/:id/verify', [
  authenticateToken,
  body('actualOutcome').isObject(),
  body('accuracy').isFloat({ min: 0, max: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const prediction = await Prediction.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!prediction) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Prediction not found'
      });
    }

    await prediction.update({
      actualOutcome: req.body.actualOutcome,
      accuracy: req.body.accuracy,
      isVerified: true
    });

    res.json({
      message: 'Prediction verified successfully',
      prediction
    });
  } catch (error) {
    console.error('Prediction verification error:', error);
    res.status(500).json({
      error: 'Prediction verification failed',
      message: 'Internal server error'
    });
  }
});

// Get advanced predictions (premium feature)
router.get('/advanced', [
  authenticateToken,
  requireSubscription(['premium', 'enterprise'])
], async (req, res) => {
  try {
    const predictions = await Prediction.findAll({
      where: { userId: req.user.id },
      order: [['confidence', 'DESC']],
      limit: 20
    });

    // Add advanced analytics for premium users
    const enhancedPredictions = predictions.map(p => ({
      ...p.toJSON(),
      trends: predictionService.calculateTrends(p),
      recommendations: predictionService.getRecommendations(p)
    }));

    res.json({
      predictions: enhancedPredictions,
      analytics: await predictionService.getAdvancedAnalytics(req.user.id)
    });
  } catch (error) {
    console.error('Advanced predictions error:', error);
    res.status(500).json({
      error: 'Advanced predictions fetch failed',
      message: 'Internal server error'
    });
  }
});

module.exports = router;

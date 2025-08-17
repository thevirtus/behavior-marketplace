const express = require('express');
const router = express.Router();
const { BehaviorLog, Prediction, User } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { requireSubscription, premiumFeature, enterpriseFeature } = require('../middleware/subscriptionMiddleware');
const { Op } = require('sequelize');

// Get basic analytics (free tier)
router.get('/basic', requireAuth, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    const userId = req.user.id;
    
    const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : timeRange === '1y' ? 365 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Basic behavior trends
    const behaviorLogs = await BehaviorLog.findAll({
      where: {
        userId,
        occurredAt: { [Op.gte]: startDate }
      },
      order: [['occurredAt', 'ASC']]
    });

    // Group by date and calculate averages
    const trends = {};
    behaviorLogs.forEach(log => {
      const date = log.occurredAt.toISOString().split('T')[0];
      if (!trends[date]) {
        trends[date] = { mood: [], energy: [], stress: [], sleep: [] };
      }
      if (log.moodRating) trends[date].mood.push(log.moodRating);
      if (log.energyLevel) trends[date].energy.push(log.energyLevel);
      if (log.stressLevel) trends[date].stress.push(log.stressLevel);
      if (log.value && log.title.toLowerCase().includes('sleep')) {
        trends[date].sleep.push(log.value);
      }
    });

    const behaviorTrends = Object.keys(trends).map(date => ({
      date,
      mood: trends[date].mood.length > 0 ? trends[date].mood.reduce((a, b) => a + b, 0) / trends[date].mood.length : null,
      energy: trends[date].energy.length > 0 ? trends[date].energy.reduce((a, b) => a + b, 0) / trends[date].energy.length : null,
      stress: trends[date].stress.length > 0 ? trends[date].stress.reduce((a, b) => a + b, 0) / trends[date].stress.length : null,
      sleep: trends[date].sleep.length > 0 ? trends[date].sleep.reduce((a, b) => a + b, 0) / trends[date].sleep.length : null
    }));

    // Category breakdown
    const categoryStats = {};
    behaviorLogs.forEach(log => {
      const category = log.BehaviorCategory?.name || 'Other';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });

    const categoryBreakdown = Object.keys(categoryStats).map(name => ({
      name,
      value: categoryStats[name],
      color: getCategoryColor(name)
    }));

    res.json({
      behaviorTrends,
      categoryBreakdown,
      totalLogs: behaviorLogs.length,
      timeRange
    });
  } catch (error) {
    console.error('Basic analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get correlation analysis (premium feature)
router.get('/correlations', requireAuth, premiumFeature('correlationAnalysis'), async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    const userId = req.user.id;
    
    const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : timeRange === '1y' ? 365 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const behaviorLogs = await BehaviorLog.findAll({
      where: {
        userId,
        occurredAt: { [Op.gte]: startDate },
        moodRating: { [Op.not]: null },
        energyLevel: { [Op.not]: null },
        stressLevel: { [Op.not]: null }
      },
      order: [['occurredAt', 'ASC']]
    });

    // Calculate correlations
    const correlations = calculateCorrelations(behaviorLogs);

    res.json({ correlations });
  } catch (error) {
    console.error('Correlation analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch correlation analysis' });
  }
});

// Get personality insights (enterprise feature)
router.get('/personality', requireAuth, enterpriseFeature('personalityInsights'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all user behavior data for personality analysis
    const behaviorLogs = await BehaviorLog.findAll({
      where: { userId },
      order: [['occurredAt', 'DESC']],
      limit: 1000
    });

    // Analyze personality traits based on behavior patterns
    const personalityInsights = analyzePersonality(behaviorLogs);

    res.json({ personalityInsights });
  } catch (error) {
    console.error('Personality insights error:', error);
    res.status(500).json({ error: 'Failed to fetch personality insights' });
  }
});

// Get predictive model performance (premium feature)
router.get('/model-performance', requireAuth, premiumFeature('advancedAnalytics'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    const predictions = await Prediction.findAll({
      where: {
        userId,
        actualOutcome: { [Op.not]: null },
        accuracyScore: { [Op.not]: null }
      }
    });

    // Group by prediction type and calculate performance metrics
    const performance = {};
    predictions.forEach(pred => {
      if (!performance[pred.predictionType]) {
        performance[pred.predictionType] = {
          accuracyScores: [],
          confidenceScores: []
        };
      }
      performance[pred.predictionType].accuracyScores.push(pred.accuracyScore);
      performance[pred.predictionType].confidenceScores.push(pred.confidenceScore);
    });

    const predictiveAccuracy = Object.keys(performance).map(model => ({
      model: formatModelName(model),
      accuracy: Math.round(average(performance[model].accuracyScores) * 100),
      confidence: average(performance[model].confidenceScores)
    }));

    res.json({ predictiveAccuracy });
  } catch (error) {
    console.error('Model performance error:', error);
    res.status(500).json({ error: 'Failed to fetch model performance' });
  }
});

// Helper functions
function getCategoryColor(category) {
  const colors = {
    'Sleep': '#6366f1',
    'Exercise': '#10b981',
    'Nutrition': '#f59e0b',
    'Work': '#3b82f6',
    'Social': '#8b5cf6',
    'Entertainment': '#ec4899',
    'Shopping': '#06b6d4',
    'Travel': '#84cc16',
    'Health': '#ef4444',
    'Learning': '#f97316',
    'Finance': '#22c55e',
    'Technology': '#a855f7'
  };
  return colors[category] || '#6b7280';
}

function calculateCorrelations(behaviorLogs) {
  // Simplified correlation calculation
  const factors = {
    'Exercise': behaviorLogs.filter(log => log.title.toLowerCase().includes('exercise')).length,
    'Sleep Quality': behaviorLogs.filter(log => log.title.toLowerCase().includes('sleep')).length,
    'Social Time': behaviorLogs.filter(log => log.title.toLowerCase().includes('social')).length,
    'Work Hours': behaviorLogs.filter(log => log.title.toLowerCase().includes('work')).length,
    'Screen Time': behaviorLogs.filter(log => log.title.toLowerCase().includes('screen')).length
  };

  const avgMood = average(behaviorLogs.map(log => log.moodRating));
  const avgEnergy = average(behaviorLogs.map(log => log.energyLevel));
  const avgStress = average(behaviorLogs.map(log => log.stressLevel));

  return Object.keys(factors).map(factor => ({
    factor,
    mood: Math.random() * 0.4 + 0.4, // Mock correlation
    energy: Math.random() * 0.4 + 0.4,
    stress: -(Math.random() * 0.4 + 0.2)
  }));
}

function analyzePersonality(behaviorLogs) {
  // Mock personality analysis - in real app, use ML models
  const traits = [
    { trait: 'Conscientiousness', score: 75 + Math.random() * 20, percentile: 80 + Math.random() * 15 },
    { trait: 'Openness', score: 70 + Math.random() * 20, percentile: 75 + Math.random() * 15 },
    { trait: 'Extraversion', score: 60 + Math.random() * 20, percentile: 65 + Math.random() * 15 },
    { trait: 'Agreeableness', score: 80 + Math.random() * 15, percentile: 85 + Math.random() * 10 },
    { trait: 'Neuroticism', score: 20 + Math.random() * 20, percentile: 15 + Math.random() * 20 }
  ];

  return { traits };
}

function formatModelName(type) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function average(arr) {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

module.exports = router;

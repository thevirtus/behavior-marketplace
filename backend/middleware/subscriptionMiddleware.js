const { User } = require('../models');

// Subscription tier requirements
const SUBSCRIPTION_FEATURES = {
  free: {
    maxBehaviorLogs: 50,
    maxPredictions: 5,
    basicAnalytics: true,
    communityAccess: true,
    maxChallenges: 2
  },
  premium: {
    maxBehaviorLogs: 1000,
    maxPredictions: 50,
    basicAnalytics: true,
    advancedAnalytics: true,
    correlationAnalysis: true,
    communityAccess: true,
    prioritySupport: true,
    maxChallenges: 10,
    customThemes: true,
    exportData: true
  },
  enterprise: {
    maxBehaviorLogs: -1, // unlimited
    maxPredictions: -1, // unlimited
    basicAnalytics: true,
    advancedAnalytics: true,
    correlationAnalysis: true,
    personalityInsights: true,
    predictiveModeling: true,
    communityAccess: true,
    prioritySupport: true,
    dedicatedSupport: true,
    maxChallenges: -1, // unlimited
    customThemes: true,
    exportData: true,
    apiAccess: true,
    whiteLabel: true,
    customIntegrations: true
  }
};

// Middleware to check subscription access
const requireSubscription = (requiredTier, feature = null) => {
  return async (req, res, next) => {
    try {
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const userTier = user.subscriptionTier || 'free';
      const tierHierarchy = ['free', 'premium', 'enterprise'];
      const userTierIndex = tierHierarchy.indexOf(userTier);
      const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

      if (userTierIndex < requiredTierIndex) {
        return res.status(403).json({
          error: 'Subscription upgrade required',
          message: `This feature requires ${requiredTier} subscription`,
          currentTier: userTier,
          requiredTier: requiredTier,
          upgradeUrl: `/pricing?upgrade=${requiredTier}`
        });
      }

      // Check specific feature access
      if (feature) {
        const userFeatures = SUBSCRIPTION_FEATURES[userTier];
        if (!userFeatures[feature]) {
          return res.status(403).json({
            error: 'Feature not available',
            message: `${feature} is not available in your current plan`,
            currentTier: userTier,
            availableIn: getFeatureAvailability(feature)
          });
        }
      }

      req.userTier = userTier;
      req.userFeatures = SUBSCRIPTION_FEATURES[userTier];
      next();
    } catch (error) {
      console.error('Subscription middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Check usage limits
const checkUsageLimit = (limitType) => {
  return async (req, res, next) => {
    try {
      const user = await User.findByPk(req.user.id);
      const userTier = user.subscriptionTier || 'free';
      const limits = SUBSCRIPTION_FEATURES[userTier];
      
      let currentUsage = 0;
      let maxUsage = limits[limitType];

      // If unlimited (-1), skip check
      if (maxUsage === -1) {
        return next();
      }

      switch (limitType) {
        case 'maxBehaviorLogs':
          const { BehaviorLog } = require('../models');
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          
          currentUsage = await BehaviorLog.count({
            where: {
              userId: req.user.id,
              createdAt: { [require('sequelize').Op.gte]: startOfMonth }
            }
          });
          break;

        case 'maxPredictions':
          const { Prediction } = require('../models');
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          
          currentUsage = await Prediction.count({
            where: {
              userId: req.user.id,
              createdAt: { [require('sequelize').Op.gte]: startOfDay }
            }
          });
          break;

        case 'maxChallenges':
          const { UserChallenge } = require('../models');
          currentUsage = await UserChallenge.count({
            where: {
              userId: req.user.id,
              status: 'active'
            }
          });
          break;
      }

      if (currentUsage >= maxUsage) {
        return res.status(429).json({
          error: 'Usage limit exceeded',
          message: `You have reached your ${limitType} limit for your current plan`,
          currentUsage,
          maxUsage,
          currentTier: userTier,
          upgradeUrl: '/pricing'
        });
      }

      req.currentUsage = currentUsage;
      req.maxUsage = maxUsage;
      next();
    } catch (error) {
      console.error('Usage limit middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Get feature availability across tiers
const getFeatureAvailability = (feature) => {
  const availability = [];
  Object.keys(SUBSCRIPTION_FEATURES).forEach(tier => {
    if (SUBSCRIPTION_FEATURES[tier][feature]) {
      availability.push(tier);
    }
  });
  return availability;
};

// Middleware to add subscription info to response
const addSubscriptionInfo = async (req, res, next) => {
  try {
    if (req.user) {
      const user = await User.findByPk(req.user.id);
      const userTier = user.subscriptionTier || 'free';
      
      req.subscriptionInfo = {
        tier: userTier,
        features: SUBSCRIPTION_FEATURES[userTier],
        limits: await getUserLimits(req.user.id, userTier)
      };
    }
    next();
  } catch (error) {
    console.error('Subscription info middleware error:', error);
    next();
  }
};

// Get current usage for all limits
const getUserLimits = async (userId, tier) => {
  const limits = SUBSCRIPTION_FEATURES[tier];
  const usage = {};

  try {
    // Behavior logs this month
    if (limits.maxBehaviorLogs !== -1) {
      const { BehaviorLog } = require('../models');
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      usage.behaviorLogs = {
        current: await BehaviorLog.count({
          where: {
            userId,
            createdAt: { [require('sequelize').Op.gte]: startOfMonth }
          }
        }),
        max: limits.maxBehaviorLogs
      };
    }

    // Predictions today
    if (limits.maxPredictions !== -1) {
      const { Prediction } = require('../models');
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      usage.predictions = {
        current: await Prediction.count({
          where: {
            userId,
            createdAt: { [require('sequelize').Op.gte]: startOfDay }
          }
        }),
        max: limits.maxPredictions
      };
    }

    // Active challenges
    if (limits.maxChallenges !== -1) {
      const { UserChallenge } = require('../models');
      usage.challenges = {
        current: await UserChallenge.count({
          where: {
            userId,
            status: 'active'
          }
        }),
        max: limits.maxChallenges
      };
    }

    return usage;
  } catch (error) {
    console.error('Error getting user limits:', error);
    return {};
  }
};

// Premium feature wrapper
const premiumFeature = (feature) => {
  return requireSubscription('premium', feature);
};

// Enterprise feature wrapper
const enterpriseFeature = (feature) => {
  return requireSubscription('enterprise', feature);
};

module.exports = {
  requireSubscription,
  checkUsageLimit,
  addSubscriptionInfo,
  premiumFeature,
  enterpriseFeature,
  SUBSCRIPTION_FEATURES,
  getFeatureAvailability,
  getUserLimits
};

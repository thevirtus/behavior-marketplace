const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  tier: {
    type: DataTypes.ENUM('free', 'premium', 'enterprise'),
    allowNull: false,
    defaultValue: 'free'
  },
  status: {
    type: DataTypes.ENUM('active', 'canceled', 'past_due', 'unpaid'),
    defaultValue: 'active'
  },
  stripeSubscriptionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stripePriceId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  currentPeriodStart: {
    type: DataTypes.DATE,
    allowNull: true
  },
  currentPeriodEnd: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelAtPeriodEnd: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  features: {
    type: DataTypes.JSONB,
    defaultValue: {
      maxPredictions: 5,
      advancedAnalytics: false,
      marketplaceAccess: false,
      apiAccess: false,
      customReports: false
    }
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['stripeSubscriptionId']
    },
    {
      fields: ['tier', 'status']
    }
  ]
});

module.exports = Subscription;

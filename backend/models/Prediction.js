const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Prediction = sequelize.define('Prediction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  predictionType: {
    type: DataTypes.ENUM(
      'purchase_likelihood',
      'app_usage_duration',
      'sleep_quality',
      'exercise_frequency',
      'decision_pattern',
      'behavior_change'
    ),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  prediction: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  confidence: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0.0,
      max: 1.0
    }
  },
  timeframe: {
    type: DataTypes.ENUM('1_day', '3_days', '1_week', '1_month'),
    defaultValue: '1_day'
  },
  targetDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  actualOutcome: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  accuracy: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0.0,
      max: 1.0
    }
  },
  modelVersion: {
    type: DataTypes.STRING,
    defaultValue: '1.0'
  },
  features: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'targetDate']
    },
    {
      fields: ['predictionType', 'targetDate']
    },
    {
      fields: ['targetDate']
    }
  ]
});

module.exports = Prediction;

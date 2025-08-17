const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BehaviorLog = sequelize.define('BehaviorLog', {
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
  category: {
    type: DataTypes.ENUM(
      'purchase', 
      'app_usage', 
      'sleep', 
      'exercise', 
      'food', 
      'social', 
      'work', 
      'entertainment',
      'health',
      'travel'
    ),
    allowNull: false
  },
  subcategory: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  source: {
    type: DataTypes.ENUM('manual', 'wearable', 'api'),
    defaultValue: 'manual'
  },
  confidence: {
    type: DataTypes.FLOAT,
    defaultValue: 1.0,
    validate: {
      min: 0.0,
      max: 1.0
    }
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'timestamp']
    },
    {
      fields: ['category', 'timestamp']
    },
    {
      fields: ['timestamp']
    }
  ]
});

module.exports = BehaviorLog;

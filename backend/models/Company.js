const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: true
  },
  size: {
    type: DataTypes.ENUM('startup', 'small', 'medium', 'large', 'enterprise'),
    allowNull: true
  },
  subscriptionTier: {
    type: DataTypes.ENUM('basic', 'professional', 'enterprise'),
    defaultValue: 'basic'
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  totalSpent: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  apiKey: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['email']
    },
    {
      fields: ['apiKey']
    },
    {
      fields: ['subscriptionTier']
    }
  ]
});

module.exports = Company;

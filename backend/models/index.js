const sequelize = require('../config/database');
const User = require('./User');
const BehaviorLog = require('./BehaviorLog');
const Prediction = require('./Prediction');
const Transaction = require('./Transaction');
const Subscription = require('./Subscription');
const Company = require('./Company');

// Define associations
User.hasMany(BehaviorLog, { foreignKey: 'userId', as: 'behaviorLogs' });
BehaviorLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Prediction, { foreignKey: 'userId', as: 'predictions' });
Prediction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Subscription, { foreignKey: 'userId', as: 'subscription' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Company.hasMany(Transaction, { foreignKey: 'companyId', as: 'transactions' });
Transaction.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

module.exports = {
  sequelize,
  User,
  BehaviorLog,
  Prediction,
  Transaction,
  Subscription,
  Company
};

const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'Invalid token or user not found' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'Token expired' 
      });
    }
    return res.status(500).json({ 
      error: 'Server error', 
      message: 'Token verification failed' 
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

const requireSubscription = (tiers) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'Authentication required' 
      });
    }

    if (!tiers.includes(req.user.subscriptionTier)) {
      return res.status(403).json({ 
        error: 'Subscription required', 
        message: `This feature requires ${tiers.join(' or ')} subscription`,
        upgradeRequired: true
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireSubscription
};

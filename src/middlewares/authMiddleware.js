const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Access token required' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch fresh user data
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Check if user is soft deleted
    if (user.deleted_at) {
      return res.status(401).json({ 
        success: false,
        message: 'Account has been deactivated' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token' 
    });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Insufficient permissions.' 
      });
    }
    next();
  };
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Admin access required.' 
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  requireAdmin
};
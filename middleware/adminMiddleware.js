const User = require('../model/newModel'); // Fixed path consistency

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Direct role comparison (works regardless of mongoose methods)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Middleware to check specific role
const requireRole = (role) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }

      if (!req.user.hasRole(role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. ${role} role required.`
        });
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  };
};

// Middleware to check multiple roles
const requireAnyRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }

      const hasRequiredRole = roles.some(role => req.user.hasRole(role));
      
      if (!hasRequiredRole) {
        return res.status(403).json({
          success: false,
          message: `Access denied. One of these roles required: ${roles.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  };
};

module.exports = { requireAdmin, requireRole, requireAnyRole };

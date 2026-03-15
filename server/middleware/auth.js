/**
 * Authentication Middleware
 * Handles session-based authentication and role-based access control
 */

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ 
    error: 'Unauthorized: No active session. Please log in.' 
  });
};

// Check if user has admin role
const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ 
    error: 'Forbidden: Admin access required.' 
  });
};

// Check if user has user role (or admin, since admin inherits user permissions)
const isUser = (req, res, next) => {
  if (req.session && req.session.user && (req.session.user.role === 'user' || req.session.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ 
    error: 'Forbidden: User access required.' 
  });
};

// Optional auth - populates user if logged in but doesn't require it
const optionalAuth = (req, res, next) => {
  // User is already attached to req via session
  next();
};

// Check if user owns the resource or is admin
const isOwnerOrAdmin = (resourceUserIdField = 'user_id') => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (req.session.user.role === 'admin' || req.session.user.id == userId) {
      return next();
    }
    
    return res.status(403).json({ 
      error: 'Forbidden: You do not have permission to access this resource.' 
    });
  };
};

module.exports = {
  isAuthenticated,
  isAdmin,
  isUser,
  optionalAuth,
  isOwnerOrAdmin
};

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Cache for rate limiting auth attempts
const authAttempts = new Map();

// Rate limiting for authentication attempts
const rateLimitAuth = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  if (!authAttempts.has(ip)) {
    authAttempts.set(ip, { count: 0, resetTime: now + windowMs });
  }

  const attempt = authAttempts.get(ip);
  
  if (now > attempt.resetTime) {
    attempt.count = 0;
    attempt.resetTime = now + windowMs;
  }

  if (attempt.count >= maxAttempts) {
    return res.status(429).json({
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: Math.ceil((attempt.resetTime - now) / 1000)
    });
  }

  attempt.count++;
  next();
};

// Enhanced authentication middleware
const auth = async (req, res, next) => {
  try {
    // Check for token in multiple locations
    const token = req.header('Authorization')?.replace('Bearer ', '') ||
                 req.header('x-auth-token') ||
                 req.cookies?.token;

    if (!token) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (!decoded.userId) {
      return res.status(401).json({ 
        message: 'Invalid token format.',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    // Get user with enhanced error handling
    const user = await User.findById(decoded.userId)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(401).json({ 
        message: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Account is deactivated.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Check if token is expired
    const tokenAge = Date.now() - (decoded.iat * 1000);
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    if (tokenAge > maxAge) {
      return res.status(401).json({ 
        message: 'Token expired.',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Add user to request
    req.user = user;
    
    // Update last login if not updated recently
    const lastLoginThreshold = 5 * 60 * 1000; // 5 minutes
    if (!user.lastLogin || (Date.now() - new Date(user.lastLogin).getTime()) > lastLoginThreshold) {
      await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    res.status(500).json({ 
      message: 'Authentication error.',
      code: 'AUTH_ERROR'
    });
  }
};

// Enhanced admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (!req.user) {
        return res.status(401).json({ 
          message: 'Authentication required.',
          code: 'AUTH_REQUIRED'
        });
      }

      if (req.user.role !== 'admin') {
        return res.status(403).json({ 
          message: 'Access denied. Admin role required.',
          code: 'ADMIN_REQUIRED'
        });
      }

      next();
    });
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(403).json({ 
      message: 'Access denied.',
      code: 'ACCESS_DENIED'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') ||
                 req.header('x-auth-token') ||
                 req.cookies?.token;

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId)
      .select('-password')
      .lean();

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Don't fail for optional auth, just continue without user
    next();
  }
};

// Token refresh middleware
const refreshToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') ||
                 req.header('x-auth-token') ||
                 req.cookies?.token;

    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided for refresh.',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        message: 'Invalid token or user inactive.',
        code: 'INVALID_TOKEN'
      });
    }

    // Generate new token
    const newToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Set new token in response header
    res.set('X-New-Token', newToken);
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ 
      message: 'Token refresh failed.',
      code: 'REFRESH_FAILED'
    });
  }
};

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// Permission-based access control middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check specific permissions (can be extended based on your permission system)
    const userPermissions = req.user.permissions || [];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ 
        message: `Access denied. Required permission: ${permission}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// Clean up old auth attempts periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, attempt] of authAttempts.entries()) {
    if (now > attempt.resetTime) {
      authAttempts.delete(ip);
    }
  }
}, 60 * 1000); // Clean up every minute

module.exports = { 
  auth, 
  adminAuth, 
  optionalAuth, 
  refreshToken, 
  requireRole, 
  requirePermission,
  rateLimitAuth
}; 
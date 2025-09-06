const roles = {
  ADMIN: 'ADMIN',
  INSPECTOR: 'INSPECTOR',
  ENTERPRISE: 'ENTERPRISE',
  USER: 'USER'
};

// Role hierarchy - higher roles inherit permissions from lower roles
const roleHierarchy = {
  [roles.ADMIN]: [roles.INSPECTOR, roles.ENTERPRISE, roles.USER],
  [roles.INSPECTOR]: [roles.USER],
  [roles.ENTERPRISE]: [roles.USER],
  [roles.USER]: []
};

// Detailed permissions mapping
const permissions = {
  conventions: {
    create: [roles.ADMIN],
    read: [roles.ADMIN, roles.INSPECTOR, roles.ENTERPRISE],
    update: [roles.ADMIN],
    delete: [roles.ADMIN],
    validate: [roles.ADMIN, roles.INSPECTOR]
  },
  indicators: {
    create: [roles.ADMIN],
    read: [roles.ADMIN, roles.INSPECTOR, roles.ENTERPRISE],
    update: [roles.ADMIN],
    submit: [roles.ENTERPRISE],
    validate: [roles.INSPECTOR, roles.ADMIN]
  },
  documents: {
    upload: [roles.ENTERPRISE],
    read: [roles.ADMIN, roles.INSPECTOR, roles.ENTERPRISE],
    validate: [roles.INSPECTOR, roles.ADMIN],
    delete: [roles.ADMIN]
  },
  visits: {
    schedule: [roles.ADMIN, roles.INSPECTOR],
    read: [roles.ADMIN, roles.INSPECTOR, roles.ENTERPRISE],
    report: [roles.INSPECTOR],
    cancel: [roles.ADMIN, roles.INSPECTOR]
  },
  enterprises: {
    create: [roles.ADMIN],
    read: [roles.ADMIN, roles.INSPECTOR],
    update: [roles.ADMIN],
    delete: [roles.ADMIN]
  }
};

// Check if a role has permission including inherited permissions
const hasPermission = (userRole, resource, action) => {
  if (!permissions[resource] || !permissions[resource][action]) {
    return false;
  }

  const allowedRoles = permissions[resource][action];
  const inheritedRoles = roleHierarchy[userRole] || [];

  return allowedRoles.includes(userRole) ||
         inheritedRoles.some(role => allowedRoles.includes(role));
};

// Middleware to check role
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const hasRole = allowedRoles.some(role =>
      req.user.role === role || (roleHierarchy[req.user.role] || []).includes(role)
    );

    if (!hasRole) {
      return res.status(403).json({
        message: 'Forbidden - Insufficient role',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Middleware to check specific permission
const checkPermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!hasPermission(req.user.role, resource, action)) {
      return res.status(403).json({
        message: 'Forbidden - Insufficient permissions',
        required: { resource, action },
        current: req.user.role
      });
    }

    next();
  };
};

// Helper to check multiple permissions at once
const checkMultiplePermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const hasAllPermissions = permissions.every(({ resource, action }) =>
      hasPermission(req.user.role, resource, action)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        message: 'Forbidden - Insufficient permissions',
        required: permissions,
        current: req.user.role
      });
    }

    next();
  };
};

module.exports = {
  roles,
  permissions,
  checkRole,
  checkPermission,
  checkMultiplePermissions,
  hasPermission
};

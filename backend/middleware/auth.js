import jwt from 'jsonwebtoken';

export const auth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization token, access denied' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token missing from bearer auth, access denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'crimegpt_jwt_secret_token_123456789');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is invalid or expired, access denied' });
  }
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized user context' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Role ${req.user.role} does not have permission.` });
    }
    
    next();
  };
};

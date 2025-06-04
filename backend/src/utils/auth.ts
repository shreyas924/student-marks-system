import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '../models';
import { logger } from './logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

export const generateToken = (user: User): string => {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyToken = async (token: string): Promise<JwtPayload> => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token format');
    }
    throw new Error('Token verification failed');
  }
};

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    logger.info('Auth attempt', {
      headers: req.headers,
      method: req.method,
      path: req.path
    });
    
    if (!authHeader) {
      logger.warn('Authentication failed: No authorization header');
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader;

    if (!token) {
      logger.warn('Authentication failed: No token provided');
      res.status(401).json({
        status: 'error',
        message: 'No token provided'
      });
      return;
    }

    try {
      const decoded = await verifyToken(token);
      logger.info(`Token verified for user ID: ${decoded.id}`);

      const user = await User.findByPk(decoded.id);
      if (!user) {
        logger.warn(`Authentication failed: User not found for ID ${decoded.id}`);
        res.status(401).json({
          status: 'error',
          message: 'User not found'
        });
        return;
      }

      if (!user.isActive) {
        logger.warn(`Authentication failed: User ${decoded.id} is inactive`);
        res.status(403).json({
          status: 'error',
          message: 'User account is inactive'
        });
        return;
      }

      req.user = user;
      next();
    } catch (tokenError: any) {
      logger.error('Token verification failed:', {
        error: tokenError.message,
        token: token.substring(0, 10) + '...' // Log only first 10 chars for security
      });
      res.status(401).json({
        status: 'error',
        message: tokenError.message || 'Invalid token'
      });
    }
  } catch (error: any) {
    logger.error('Authentication error:', {
      error: error.message,
      stack: error.stack
    });
    res.status(401).json({
      status: 'error',
      message: error.message || 'Authentication failed'
    });
  }
};

export const authorize = (roles: string | string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Not authenticated',
      });
      return;
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Authorization failed: User ${req.user.id} with role ${req.user.role} attempted to access restricted route`);
      res.status(403).json({
        status: 'error',
        message: 'Not authorized to access this resource',
      });
      return;
    }

    next();
  };
}; 
import { Request, Response, NextFunction } from 'express';

export const checkRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }

      next();
    } catch (error) {
      res.status(401).json({
        status: 'error',
        message: 'Please authenticate'
      });
    }
  };
}; 
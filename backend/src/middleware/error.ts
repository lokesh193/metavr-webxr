import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Unhandled Error [${req.method} ${req.url}]:`, err.message || err);

  // Sentry / Error logging integration stub
  if (process.env.SENTRY_DSN) {
    // Sentry.captureException(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

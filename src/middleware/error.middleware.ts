import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void {
  console.error(`[Error] ${err.message}`, err.stack);

  const statusCode = err.statusCode || 500;
  const message = statusCode < 500 ? err.message : 'Internal server error';

  res.status(statusCode).json({ error: message });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Route not found' });
}

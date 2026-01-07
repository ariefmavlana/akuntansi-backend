import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '@/utils/response';
import logger from '@/utils/logger';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError | ZodError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((error) => ({
      field: error.path.join('.'),
      message: error.message,
    }));

    ResponseUtil.validationError(res, errors);
    return;
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      ResponseUtil.badRequest(res, 'Record already exists', {
        fields: err.meta?.target,
      });
      return;
    }

    if (err.code === 'P2025') {
      ResponseUtil.notFound(res, 'Record not found');
      return;
    }

    if (err.code === 'P2003') {
      ResponseUtil.badRequest(res, 'Foreign key constraint failed');
      return;
    }
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    ResponseUtil.error(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  // Handle generic errors
  ResponseUtil.internalError(res, err.message || 'Something went wrong');
};

export const notFoundHandler = (req: Request, res: Response): void => {
  ResponseUtil.notFound(res, `Route ${req.method} ${req.path} not found`);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export class ResponseUtil {
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200,
    meta?: ApiResponse<T>['meta']
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      ...(meta && { meta }),
    };

    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message = 'Resource created'): Response {
    return this.success(res, data, message, 201);
  }

  static error(
    res: Response,
    code: string,
    message: string,
    statusCode = 400,
    details?: unknown
  ): Response {
    const response: ApiResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined && { details }),
      },
    };

    return res.status(statusCode).json(response);
  }

  static badRequest(res: Response, message: string, details?: unknown): Response {
    return this.error(res, 'BAD_REQUEST', message, 400, details);
  }

  static unauthorized(res: Response, message = 'Unauthorized'): Response {
    return this.error(res, 'UNAUTHORIZED', message, 401);
  }

  static forbidden(res: Response, message = 'Forbidden'): Response {
    return this.error(res, 'FORBIDDEN', message, 403);
  }

  static notFound(res: Response, message = 'Resource not found'): Response {
    return this.error(res, 'NOT_FOUND', message, 404);
  }

  static validationError(res: Response, details: unknown): Response {
    return this.error(res, 'VALIDATION_ERROR', 'Validation failed', 422, details);
  }

  static internalError(res: Response, message = 'Internal server error'): Response {
    return this.error(res, 'INTERNAL_ERROR', message, 500);
  }
}

// Convenience exports
export const successResponse = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode?: number,
  meta?: ApiResponse<T>['meta']
) => ResponseUtil.success(res, data, message, statusCode, meta);

export const errorResponse = (
  res: Response,
  code: string,
  message: string,
  statusCode?: number,
  details?: unknown
) => ResponseUtil.error(res, code, message, statusCode, details);

export const createdResponse = <T>(res: Response, data: T, message?: string) =>
  ResponseUtil.created(res, data, message);

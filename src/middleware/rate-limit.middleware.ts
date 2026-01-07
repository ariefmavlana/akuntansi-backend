import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';
import { ResponseUtil } from '@/utils/response';
import { Request, Response } from 'express';

export const generalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    ResponseUtil.error(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Too many requests from this IP, please try again later',
      429
    );
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true,
  handler: (req: Request, res: Response) => {
    ResponseUtil.error(
      res,
      'AUTH_RATE_LIMIT_EXCEEDED',
      'Too many authentication attempts, please try again later',
      429
    );
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'API rate limit exceeded',
  handler: (req: Request, res: Response) => {
    ResponseUtil.error(res, 'API_RATE_LIMIT_EXCEEDED', 'API rate limit exceeded', 429);
  },
});


import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwt';
import { AuthenticationError } from '@/services/auth.service';
import prisma from '@/config/database';
import logger from '@/utils/logger';

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
        perusahaanId: string;
    };
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            logger.warn(`Auth failed: No token provided for ${req.path}`);
            throw new AuthenticationError('No token provided');
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            logger.warn(`Auth failed: Invalid token format for ${req.path}. Header: ${authHeader}`);
            throw new AuthenticationError('Invalid token format');
        }

        try {
            const payload = verifyToken(token, 'access');

            req.user = {
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
                perusahaanId: payload.perusahaanId
            };

            next();
        } catch (jwtError: any) {
            logger.warn(`Auth failed: JWT verification error for ${req.path}: ${jwtError.message}`);
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Token tidak valid atau sudah kadaluarsa'
                }
            });
        }
    } catch (error) {
        if (error instanceof AuthenticationError) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: error.message
                }
            });
        } else {
            logger.error('Auth Middleware Critical Error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Internal server error during authentication'
                }
            });
        }
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ status: 'error', message: 'Forbidden' });
        }

        next();
    };
};

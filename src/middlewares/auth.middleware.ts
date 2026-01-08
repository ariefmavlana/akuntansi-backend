
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
            throw new AuthenticationError('No token provided');
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new AuthenticationError('Invalid token format');
        }

        const payload = verifyToken(token, 'access');

        // Optional: Check if user still exists/active
        // const user = await prisma.pengguna.findUnique({ where: { id: payload.userId } });
        // if (!user || !user.isAktif) throw new AuthenticationError('User not active');

        req.user = {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            perusahaanId: payload.perusahaanId
        };

        next();
    } catch (error) {
        if (error instanceof AuthenticationError) {
            res.status(401).json({ status: 'error', message: error.message });
        } else {
            logger.warn('Auth Middleware Error:', error);
            res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
        }
    }
};

export const authorize = (roles: string[]) => {
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

import { Request, Response, NextFunction } from 'express';
import { JwtUtil, JwtPayload } from '@/utils/jwt';
import { ResponseUtil } from '@/utils/response';
import prisma from '@/config/database';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ResponseUtil.unauthorized(res, 'No token provided');
      return;
    }

    const token = authHeader.substring(7);

    try {
      const payload = JwtUtil.verifyAccessToken(token);

      // Verify user still exists and is active
      const user = await prisma.pengguna.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          role: true,
          perusahaanId: true,
          isAktif: true,
        },
      });

      if (!user || !user.isAktif) {
        ResponseUtil.unauthorized(res, 'User not found or inactive');
        return;
      }

      req.user = payload;
      next();
    } catch (error) {
      if (error instanceof Error) {
        ResponseUtil.unauthorized(res, error.message);
      } else {
        ResponseUtil.unauthorized(res, 'Invalid token');
      }
    }
  } catch (error) {
    ResponseUtil.internalError(res);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseUtil.unauthorized(res);
      return;
    }

    if (!roles.includes(req.user.role)) {
      ResponseUtil.forbidden(res, 'Insufficient permissions');
      return;
    }

    next();
  };
};

export const requireFeature = (featureCode: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        ResponseUtil.unauthorized(res);
        return;
      }

      // Check if user's company has access to this feature
      const hasAccess = await prisma.perusahaanPaket.findFirst({
        where: {
          perusahaanId: req.user.perusahaanId,
          isAktif: true,
          tanggalMulai: { lte: new Date() },
          OR: [{ tanggalAkhir: null }, { tanggalAkhir: { gte: new Date() } }],
        },
        include: {
          paket: {
            include: {
              fitur: {
                where: {
                  kodeModul: featureCode,
                  isAktif: true,
                },
              },
            },
          },
        },
      });

      if (!hasAccess || hasAccess.paket.fitur.length === 0) {
        ResponseUtil.forbidden(res, 'Feature not available in your subscription plan');
        return;
      }

      next();
    } catch (error) {
      ResponseUtil.internalError(res);
    }
  };
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireFeature = exports.authorize = exports.authenticate = void 0;
const jwt_1 = require("@/utils/jwt");
const response_1 = require("@/utils/response");
const database_1 = __importDefault(require("@/config/database"));
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            response_1.ResponseUtil.unauthorized(res, 'No token provided');
            return;
        }
        const token = authHeader.substring(7);
        try {
            const payload = jwt_1.JwtUtil.verifyAccessToken(token);
            // Verify user still exists and is active
            const user = await database_1.default.pengguna.findUnique({
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
                response_1.ResponseUtil.unauthorized(res, 'User not found or inactive');
                return;
            }
            req.user = payload;
            next();
        }
        catch (error) {
            if (error instanceof Error) {
                response_1.ResponseUtil.unauthorized(res, error.message);
            }
            else {
                response_1.ResponseUtil.unauthorized(res, 'Invalid token');
            }
        }
    }
    catch (error) {
        response_1.ResponseUtil.internalError(res);
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            response_1.ResponseUtil.unauthorized(res);
            return;
        }
        if (!roles.includes(req.user.role)) {
            response_1.ResponseUtil.forbidden(res, 'Insufficient permissions');
            return;
        }
        next();
    };
};
exports.authorize = authorize;
const requireFeature = (featureCode) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                response_1.ResponseUtil.unauthorized(res);
                return;
            }
            // Check if user's company has access to this feature
            const hasAccess = await database_1.default.perusahaanPaket.findFirst({
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
                response_1.ResponseUtil.forbidden(res, 'Feature not available in your subscription plan');
                return;
            }
            next();
        }
        catch (error) {
            response_1.ResponseUtil.internalError(res);
        }
    };
};
exports.requireFeature = requireFeature;

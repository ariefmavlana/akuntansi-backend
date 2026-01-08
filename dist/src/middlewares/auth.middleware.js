"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const auth_service_1 = require("../services/auth.service");
const logger_1 = __importDefault(require("../utils/logger"));
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new auth_service_1.AuthenticationError('No token provided');
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new auth_service_1.AuthenticationError('Invalid token format');
        }
        const payload = (0, jwt_1.verifyToken)(token, 'access');
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
    }
    catch (error) {
        if (error instanceof auth_service_1.AuthenticationError) {
            res.status(401).json({ status: 'error', message: error.message });
        }
        else {
            logger_1.default.warn('Auth Middleware Error:', error);
            res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
        }
    }
};
exports.authenticate = authenticate;
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ status: 'error', message: 'Forbidden' });
        }
        next();
    };
};
exports.authorize = authorize;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRateLimiter = exports.authRateLimiter = exports.generalRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../config/env");
const response_1 = require("../utils/response");
exports.generalRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        response_1.ResponseUtil.error(res, 'RATE_LIMIT_EXCEEDED', 'Too many requests from this IP, please try again later', 429);
    },
});
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many authentication attempts, please try again later',
    skipSuccessfulRequests: true,
    handler: (req, res) => {
        response_1.ResponseUtil.error(res, 'AUTH_RATE_LIMIT_EXCEEDED', 'Too many authentication attempts, please try again later', 429);
    },
});
exports.apiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'API rate limit exceeded',
    handler: (req, res) => {
        response_1.ResponseUtil.error(res, 'API_RATE_LIMIT_EXCEEDED', 'API rate limit exceeded', 429);
    },
});

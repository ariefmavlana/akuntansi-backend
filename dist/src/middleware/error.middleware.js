"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.AppError = void 0;
const response_1 = require("../utils/response");
const logger_1 = __importDefault(require("../utils/logger"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) => {
    // Log error
    logger_1.default.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
    });
    // Handle Zod validation errors
    if (err instanceof zod_1.ZodError) {
        const errors = err.errors.map((error) => ({
            field: error.path.join('.'),
            message: error.message,
        }));
        response_1.ResponseUtil.validationError(res, errors);
        return;
    }
    // Handle Prisma errors
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            response_1.ResponseUtil.badRequest(res, 'Record already exists', {
                fields: err.meta?.target,
            });
            return;
        }
        if (err.code === 'P2025') {
            response_1.ResponseUtil.notFound(res, 'Record not found');
            return;
        }
        if (err.code === 'P2003') {
            response_1.ResponseUtil.badRequest(res, 'Foreign key constraint failed');
            return;
        }
    }
    // Handle custom AppError
    if (err instanceof AppError) {
        response_1.ResponseUtil.error(res, err.code, err.message, err.statusCode, err.details);
        return;
    }
    // Handle generic errors
    response_1.ResponseUtil.internalError(res, err.message || 'Something went wrong');
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    response_1.ResponseUtil.notFound(res, `Route ${req.method} ${req.path} not found`);
};
exports.notFoundHandler = notFoundHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;

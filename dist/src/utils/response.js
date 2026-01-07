"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseUtil = void 0;
class ResponseUtil {
    static success(res, data, message = 'Success', statusCode = 200, meta) {
        const response = {
            success: true,
            data,
            message,
            ...(meta && { meta }),
        };
        return res.status(statusCode).json(response);
    }
    static created(res, data, message = 'Resource created') {
        return this.success(res, data, message, 201);
    }
    static error(res, code, message, statusCode = 400, details) {
        const response = {
            success: false,
            error: {
                code,
                message,
                ...(details && { details }),
            },
        };
        return res.status(statusCode).json(response);
    }
    static badRequest(res, message, details) {
        return this.error(res, 'BAD_REQUEST', message, 400, details);
    }
    static unauthorized(res, message = 'Unauthorized') {
        return this.error(res, 'UNAUTHORIZED', message, 401);
    }
    static forbidden(res, message = 'Forbidden') {
        return this.error(res, 'FORBIDDEN', message, 403);
    }
    static notFound(res, message = 'Resource not found') {
        return this.error(res, 'NOT_FOUND', message, 404);
    }
    static validationError(res, details) {
        return this.error(res, 'VALIDATION_ERROR', 'Validation failed', 422, details);
    }
    static internalError(res, message = 'Internal server error') {
        return this.error(res, 'INTERNAL_ERROR', message, 500);
    }
}
exports.ResponseUtil = ResponseUtil;

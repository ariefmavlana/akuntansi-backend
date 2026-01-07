"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordUtil = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_1 = require("@/config/env");
class PasswordUtil {
    static async hash(password) {
        return bcryptjs_1.default.hash(password, env_1.env.BCRYPT_ROUNDS);
    }
    static async compare(password, hashedPassword) {
        return bcryptjs_1.default.compare(password, hashedPassword);
    }
    static validateStrength(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
exports.PasswordUtil = PasswordUtil;

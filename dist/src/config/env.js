"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform(Number).default('5000'),
    API_VERSION: zod_1.z.string().default('v1'),
    DATABASE_URL: zod_1.z.string().url(),
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32),
    JWT_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:3000'),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().transform(Number).default('900000'),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().transform(Number).default('100'),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('debug'),
    LOG_FILE: zod_1.z.string().default('logs/app.log'),
    BCRYPT_ROUNDS: zod_1.z.string().transform(Number).default('10'),
    MAX_FILE_SIZE: zod_1.z.string().transform(Number).default('10485760'),
    UPLOAD_PATH: zod_1.z.string().default('uploads/'),
});
function validateEnv() {
    try {
        return envSchema.parse(process.env);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            console.error('❌ Invalid environment variables:', error.errors);
            throw new Error('Environment validation failed');
        }
        throw error;
    }
}
exports.env = validateEnv();
exports.default = exports.env;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const env_1 = require("../config/env");
const path_1 = __importDefault(require("path"));
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};
const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
};
winston_1.default.addColors(logColors);
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json());
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
        msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
}));
const transports = [
    new winston_1.default.transports.Console({
        format: consoleFormat,
    }),
];
if (env_1.env.NODE_ENV !== 'test') {
    transports.push(new winston_1.default.transports.File({
        filename: path_1.default.join(process.cwd(), 'logs', 'error.log'),
        level: 'error',
        format: logFormat,
    }), new winston_1.default.transports.File({
        filename: path_1.default.join(process.cwd(), 'logs', 'combined.log'),
        format: logFormat,
    }));
}
const logger = winston_1.default.createLogger({
    levels: logLevels,
    level: env_1.env.LOG_LEVEL,
    format: logFormat,
    transports,
    exceptionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'exceptions.log'),
        }),
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'rejections.log'),
        }),
    ],
});
exports.default = logger;

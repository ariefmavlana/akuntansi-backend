"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("@/config/env");
const logger_1 = __importDefault(require("@/utils/logger"));
const database_1 = __importDefault(require("@/config/database"));
const startServer = async () => {
    try {
        // Test database connection
        await database_1.default.$connect();
        logger_1.default.info('✅ Database connected successfully');
        // Start server
        const server = app_1.default.listen(env_1.env.PORT, () => {
            logger_1.default.info(`🚀 Server running on port ${env_1.env.PORT} in ${env_1.env.NODE_ENV} mode`);
            logger_1.default.info(`📝 API available at http://localhost:${env_1.env.PORT}/api/${env_1.env.API_VERSION}`);
        });
        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            logger_1.default.info(`${signal} received. Starting graceful shutdown...`);
            server.close(async () => {
                logger_1.default.info('HTTP server closed');
                await database_1.default.$disconnect();
                logger_1.default.info('Database connection closed');
                process.exit(0);
            });
            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger_1.default.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();

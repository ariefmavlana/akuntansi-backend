import app from './app';
import { env } from '@/config/env';
import { initRecurringScheduler } from '@/schedulers/recurring.scheduler';
import prisma from '@/config/database';
import logger from '@/utils/logger';

const startServer = async (): Promise<void> => {
    try {
        await prisma.$connect();
        logger.info('✅ Database connected successfully');

        // Initialize Schedulers
        initRecurringScheduler();

        // Start server
        const server = app.listen(env.PORT, () => {
            logger.info(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
            logger.info(`📝 API available at http://localhost:${env.PORT}/api/${env.API_VERSION}`);
        });

        // Handle server startup errors (e.g. EADDRINUSE)
        server.on('error', (error: any) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`❌ Port ${env.PORT} is already in use`);
            } else {
                logger.error('❌ Server startup error:', error);
            }
            process.exit(1);
        });

        // Graceful shutdown
        const gracefulShutdown = async (signal: string): Promise<void> => {
            logger.info(`${signal} received. Starting graceful shutdown...`);

            server.close(async () => {
                logger.info('HTTP server closed');

                await prisma.$disconnect();
                logger.info('Database connection closed');

                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    } catch (error) {
        if (logger && logger.error) {
            logger.error('Failed to start server:', error);
        } else {
            console.error('Logger not available, original error:', error);
        }
        process.exit(1);
    }
};

startServer();

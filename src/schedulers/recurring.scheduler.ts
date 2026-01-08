import cron from 'node-cron';
import logger from '@/utils/logger';
import { recurringService } from '@/services/recurring.service';

/**
 * Initialize Recurring Scheduler
 * Runs daily to check for recurring transactions that need to be processed.
 */
export const initRecurringScheduler = () => {
    // Run every day at 00:01 AM
    // Cron format: Minute Hour Day Month Weekday
    cron.schedule('1 0 * * *', async () => {
        logger.info('Running Daily Recurring Transaction Job...');
        try {
            await recurringService.processDueRecurring();
            logger.info('Daily Recurring Transaction Job Completed.');
        } catch (error) {
            logger.error('Error running daily recurring job:', error);
        }
    });

    logger.info('Recurring Transaction Scheduler Initialized (Runs daily at 00:01)');
};

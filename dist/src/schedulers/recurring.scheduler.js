"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRecurringScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const logger_1 = __importDefault(require("../utils/logger"));
const recurring_service_1 = require("../services/recurring.service");
/**
 * Initialize Recurring Scheduler
 * Runs daily to check for recurring transactions that need to be processed.
 */
const initRecurringScheduler = () => {
    // Run every day at 00:01 AM
    // Cron format: Minute Hour Day Month Weekday
    node_cron_1.default.schedule('1 0 * * *', async () => {
        logger_1.default.info('Running Daily Recurring Transaction Job...');
        try {
            await recurring_service_1.recurringService.processDueRecurring();
            logger_1.default.info('Daily Recurring Transaction Job Completed.');
        }
        catch (error) {
            logger_1.default.error('Error running daily recurring job:', error);
        }
    });
    logger_1.default.info('Recurring Transaction Scheduler Initialized (Runs daily at 00:01)');
};
exports.initRecurringScheduler = initRecurringScheduler;

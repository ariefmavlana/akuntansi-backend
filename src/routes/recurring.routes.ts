import { Router } from 'express';
import { recurringController } from '@/controllers/recurring.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validation.middleware';
import {
    createRecurringTransactionSchema,
    updateRecurringTransactionSchema,
    getRecurringTransactionsSchema,
    executeRecurringTransactionSchema,
    getRecurringHistorySchema,
} from '@/validators/recurring.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create recurring transaction
router.post(
    '/',
    validate(createRecurringTransactionSchema),
    recurringController.create.bind(recurringController)
);

// Get all recurring transactions
router.get(
    '/',
    validate(getRecurringTransactionsSchema),
    recurringController.getAll.bind(recurringController)
);

// Get single recurring transaction
router.get('/:id', recurringController.getById.bind(recurringController));

// Update recurring transaction
router.put(
    '/:id',
    validate(updateRecurringTransactionSchema),
    recurringController.update.bind(recurringController)
);

// Execute recurring transaction now
router.post(
    '/:id/execute',
    validate(executeRecurringTransactionSchema),
    recurringController.execute.bind(recurringController)
);

// Get recurring transaction history
router.get(
    '/:id/history',
    validate(getRecurringHistorySchema),
    recurringController.getHistory.bind(recurringController)
);

// Delete recurring transaction
router.delete('/:id', recurringController.delete.bind(recurringController));

// Process due recurring transactions (for cron)
router.post('/cron/process', recurringController.processDue.bind(recurringController));

export default router;

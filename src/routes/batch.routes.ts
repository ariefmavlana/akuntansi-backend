import { Router } from 'express';
import { batchController } from '@/controllers/batch.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validation.middleware';
import {
    batchTransactionsSchema,
    batchApprovalsSchema,
    batchPostJournalsSchema,
    batchDeleteSchema,
} from '@/validators/batch.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Batch create transactions
router.post(
    '/transactions',
    validate(batchTransactionsSchema),
    batchController.batchCreateTransactions.bind(batchController)
);

// Batch process approvals
router.post(
    '/approvals',
    validate(batchApprovalsSchema),
    batchController.batchProcessApprovals.bind(batchController)
);

// Batch post journals
router.post(
    '/post-journals',
    validate(batchPostJournalsSchema),
    batchController.batchPostJournals.bind(batchController)
);

// Batch delete
router.delete(
    '/delete',
    validate(batchDeleteSchema),
    batchController.batchDelete.bind(batchController)
);

export default router;

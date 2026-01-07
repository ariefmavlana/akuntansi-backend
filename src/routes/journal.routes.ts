import { Router } from 'express';
import { journalController } from '@/controllers/journal.controller';
import { validate } from '@/middleware/validation.middleware';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import {
    createJournalSchema,
    getJournalByIdSchema,
    listJournalsSchema,
    getGeneralLedgerSchema,
    getTrialBalanceSchema,
    deleteJournalSchema,
} from '@/validators/journal.validator';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/journals
 * @desc    Create manual journal entry
 * @access  Private (Accountant+)
 */
router.post(
    '/',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.SENIOR_ACCOUNTANT),
    validate(createJournalSchema),
    journalController.createJournal.bind(journalController)
);

/**
 * @route   GET /api/v1/journals
 * @desc    List journals with pagination and filters
 * @access  Private
 */
router.get(
    '/',
    validate(listJournalsSchema),
    journalController.listJournals.bind(journalController)
);

/**
 * @route   GET /api/v1/journals/ledger/general
 * @desc    Get general ledger
 * @access  Private
 */
router.get(
    '/ledger/general',
    validate(getGeneralLedgerSchema),
    journalController.getGeneralLedger.bind(journalController)
);

/**
 * @route   GET /api/v1/journals/ledger/trial-balance
 * @desc    Get trial balance
 * @access  Private
 */
router.get(
    '/ledger/trial-balance',
    validate(getTrialBalanceSchema),
    journalController.getTrialBalance.bind(journalController)
);

/**
 * @route   GET /api/v1/journals/:id
 * @desc    Get journal by ID
 * @access  Private
 */
router.get(
    '/:id',
    validate(getJournalByIdSchema),
    journalController.getJournalById.bind(journalController)
);

/**
 * @route   DELETE /api/v1/journals/:id
 * @desc    Delete journal (if not closed)
 * @access  Private (Senior Accountant+)
 */
router.delete(
    '/:id',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.SENIOR_ACCOUNTANT),
    validate(deleteJournalSchema),
    journalController.deleteJournal.bind(journalController)
);

export default router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const journal_controller_1 = require("../controllers/journal.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const journal_validator_1 = require("../validators/journal.validator");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   POST /api/v1/journals
 * @desc    Create manual journal entry
 * @access  Private (Accountant+)
 */
router.post('/', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.ACCOUNTANT, client_1.Role.SENIOR_ACCOUNTANT), (0, validation_middleware_1.validate)(journal_validator_1.createJournalSchema), journal_controller_1.journalController.createJournal.bind(journal_controller_1.journalController));
/**
 * @route   GET /api/v1/journals
 * @desc    List journals with pagination and filters
 * @access  Private
 */
router.get('/', (0, validation_middleware_1.validate)(journal_validator_1.listJournalsSchema), journal_controller_1.journalController.listJournals.bind(journal_controller_1.journalController));
/**
 * @route   GET /api/v1/journals/ledger/general
 * @desc    Get general ledger
 * @access  Private
 */
router.get('/ledger/general', (0, validation_middleware_1.validate)(journal_validator_1.getGeneralLedgerSchema), journal_controller_1.journalController.getGeneralLedger.bind(journal_controller_1.journalController));
/**
 * @route   GET /api/v1/journals/ledger/trial-balance
 * @desc    Get trial balance
 * @access  Private
 */
router.get('/ledger/trial-balance', (0, validation_middleware_1.validate)(journal_validator_1.getTrialBalanceSchema), journal_controller_1.journalController.getTrialBalance.bind(journal_controller_1.journalController));
/**
 * @route   GET /api/v1/journals/:id
 * @desc    Get journal by ID
 * @access  Private
 */
router.get('/:id', (0, validation_middleware_1.validate)(journal_validator_1.getJournalByIdSchema), journal_controller_1.journalController.getJournalById.bind(journal_controller_1.journalController));
/**
 * @route   DELETE /api/v1/journals/:id
 * @desc    Delete journal (if not closed)
 * @access  Private (Senior Accountant+)
 */
router.delete('/:id', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.SENIOR_ACCOUNTANT), (0, validation_middleware_1.validate)(journal_validator_1.deleteJournalSchema), journal_controller_1.journalController.deleteJournal.bind(journal_controller_1.journalController));
exports.default = router;

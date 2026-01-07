"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transaction_controller_1 = require("../controllers/transaction.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const transaction_validator_1 = require("../validators/transaction.validator");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   POST /api/v1/transactions
 * @desc    Create new transaction
 * @access  Private (Staff+)
 */
router.post('/', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.ACCOUNTANT, client_1.Role.SENIOR_ACCOUNTANT, client_1.Role.STAFF), (0, validation_middleware_1.validate)(transaction_validator_1.createTransactionSchema), transaction_controller_1.transactionController.createTransaction.bind(transaction_controller_1.transactionController));
/**
 * @route   GET /api/v1/transactions
 * @desc    List transactions with pagination and filters
 * @access  Private
 */
router.get('/', (0, validation_middleware_1.validate)(transaction_validator_1.listTransactionsSchema), transaction_controller_1.transactionController.listTransactions.bind(transaction_controller_1.transactionController));
/**
 * @route   GET /api/v1/transactions/:id
 * @desc    Get transaction by ID
 * @access  Private
 */
router.get('/:id', (0, validation_middleware_1.validate)(transaction_validator_1.getTransactionByIdSchema), transaction_controller_1.transactionController.getTransactionById.bind(transaction_controller_1.transactionController));
/**
 * @route   PUT /api/v1/transactions/:id
 * @desc    Update transaction (draft only)
 * @access  Private (Accountant+)
 */
router.put('/:id', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.ACCOUNTANT, client_1.Role.SENIOR_ACCOUNTANT), (0, validation_middleware_1.validate)(transaction_validator_1.updateTransactionSchema), transaction_controller_1.transactionController.updateTransaction.bind(transaction_controller_1.transactionController));
/**
 * @route   POST /api/v1/transactions/:id/post
 * @desc    Post transaction (create journal entries)
 * @access  Private (Accountant+)
 */
router.post('/:id/post', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.ACCOUNTANT, client_1.Role.SENIOR_ACCOUNTANT), (0, validation_middleware_1.validate)(transaction_validator_1.postTransactionSchema), transaction_controller_1.transactionController.postTransaction.bind(transaction_controller_1.transactionController));
/**
 * @route   POST /api/v1/transactions/:id/void
 * @desc    Void transaction
 * @access  Private (Accountant+)
 */
router.post('/:id/void', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.ACCOUNTANT, client_1.Role.SENIOR_ACCOUNTANT), (0, validation_middleware_1.validate)(transaction_validator_1.voidTransactionSchema), transaction_controller_1.transactionController.voidTransaction.bind(transaction_controller_1.transactionController));
/**
 * @route   DELETE /api/v1/transactions/:id
 * @desc    Delete transaction (draft only)
 * @access  Private (Accountant+)
 */
router.delete('/:id', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.ACCOUNTANT, client_1.Role.SENIOR_ACCOUNTANT), (0, validation_middleware_1.validate)(transaction_validator_1.deleteTransactionSchema), transaction_controller_1.transactionController.deleteTransaction.bind(transaction_controller_1.transactionController));
/**
 * @route   POST /api/v1/transactions/:id/payments
 * @desc    Add payment to transaction
 * @access  Private (Cashier+)
 */
router.post('/:id/payments', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.ACCOUNTANT, client_1.Role.SENIOR_ACCOUNTANT, client_1.Role.CASHIER), (0, validation_middleware_1.validate)(transaction_validator_1.addPaymentSchema), transaction_controller_1.transactionController.addPayment.bind(transaction_controller_1.transactionController));
exports.default = router;

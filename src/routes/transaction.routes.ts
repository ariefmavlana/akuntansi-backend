import { Router } from 'express';
import { transactionController } from '@/controllers/transaction.controller';
import { validate } from '@/middlewares/validation.middleware';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import {
    createTransactionSchema,
    updateTransactionSchema,
    getTransactionByIdSchema,
    listTransactionsSchema,
    postTransactionSchema,
    voidTransactionSchema,
    deleteTransactionSchema,
    addPaymentSchema,
} from '@/validators/transaction.validator';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/transactions
 * @desc    Create new transaction
 * @access  Private (Staff+)
 */
router.post(
    '/',
    authorize(
        Role.SUPERADMIN,
        Role.ADMIN,
        Role.ACCOUNTANT,
        Role.SENIOR_ACCOUNTANT,
        Role.STAFF
    ),
    validate(createTransactionSchema),
    transactionController.createTransaction.bind(transactionController)
);

/**
 * @route   GET /api/v1/transactions
 * @desc    List transactions with pagination and filters
 * @access  Private
 */
router.get(
    '/',
    validate(listTransactionsSchema),
    transactionController.listTransactions.bind(transactionController)
);

/**
 * @route   GET /api/v1/transactions/:id
 * @desc    Get transaction by ID
 * @access  Private
 */
router.get(
    '/:id',
    validate(getTransactionByIdSchema),
    transactionController.getTransactionById.bind(transactionController)
);

/**
 * @route   PUT /api/v1/transactions/:id
 * @desc    Update transaction (draft only)
 * @access  Private (Accountant+)
 */
router.put(
    '/:id',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.SENIOR_ACCOUNTANT),
    validate(updateTransactionSchema),
    transactionController.updateTransaction.bind(transactionController)
);

/**
 * @route   POST /api/v1/transactions/:id/post
 * @desc    Post transaction (create journal entries)
 * @access  Private (Accountant+)
 */
router.post(
    '/:id/post',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.SENIOR_ACCOUNTANT),
    validate(postTransactionSchema),
    transactionController.postTransaction.bind(transactionController)
);

/**
 * @route   POST /api/v1/transactions/:id/void
 * @desc    Void transaction
 * @access  Private (Accountant+)
 */
router.post(
    '/:id/void',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.SENIOR_ACCOUNTANT),
    validate(voidTransactionSchema),
    transactionController.voidTransaction.bind(transactionController)
);

/**
 * @route   DELETE /api/v1/transactions/:id
 * @desc    Delete transaction (draft only)
 * @access  Private (Accountant+)
 */
router.delete(
    '/:id',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.SENIOR_ACCOUNTANT),
    validate(deleteTransactionSchema),
    transactionController.deleteTransaction.bind(transactionController)
);

/**
 * @route   POST /api/v1/transactions/:id/payments
 * @desc    Add payment to transaction
 * @access  Private (Cashier+)
 */
router.post(
    '/:id/payments',
    authorize(
        Role.SUPERADMIN,
        Role.ADMIN,
        Role.ACCOUNTANT,
        Role.SENIOR_ACCOUNTANT,
        Role.CASHIER
    ),
    validate(addPaymentSchema),
    transactionController.addPayment.bind(transactionController)
);

export default router;

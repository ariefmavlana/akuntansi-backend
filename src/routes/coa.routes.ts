import { Router } from 'express';
import { coaController } from '@/controllers/coa.controller';
import { validate } from '@/middlewares/validation.middleware';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import {
    createCoaSchema,
    updateCoaSchema,
    getCoaByIdSchema,
    listCoaSchema,
    deleteCoaSchema,
    getCoaHierarchySchema,
    updateCoaBalanceSchema,
} from '@/validators/coa.validator';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/coa/hierarchy
 * @desc    Get account hierarchy
 * @access  Private
 */
router.get(
    '/hierarchy',
    validate(getCoaHierarchySchema),
    coaController.getAccountHierarchy.bind(coaController)
);

/**
 * @route   POST /api/v1/coa
 * @desc    Create new account
 * @access  Private (Admin, Accountant)
 */
router.post(
    '/',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.SENIOR_ACCOUNTANT),
    validate(createCoaSchema),
    coaController.createAccount.bind(coaController)
);

/**
 * @route   GET /api/v1/coa
 * @desc    List accounts with pagination and filters
 * @access  Private
 */
router.get('/', validate(listCoaSchema), coaController.listAccounts.bind(coaController));

/**
 * @route   GET /api/v1/coa/:id
 * @desc    Get account by ID
 * @access  Private
 */
router.get(
    '/:id',
    validate(getCoaByIdSchema),
    coaController.getAccountById.bind(coaController)
);

/**
 * @route   PUT /api/v1/coa/:id
 * @desc    Update account
 * @access  Private (Admin, Accountant)
 */
router.put(
    '/:id',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.SENIOR_ACCOUNTANT),
    validate(updateCoaSchema),
    coaController.updateAccount.bind(coaController)
);

/**
 * @route   PUT /api/v1/coa/:id/balance
 * @desc    Update account balance
 * @access  Private (Admin, Accountant)
 */
router.put(
    '/:id/balance',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.SENIOR_ACCOUNTANT),
    validate(updateCoaBalanceSchema),
    coaController.updateAccountBalance.bind(coaController)
);

/**
 * @route   DELETE /api/v1/coa/:id
 * @desc    Delete account
 * @access  Private (Admin, Accountant)
 */
router.delete(
    '/:id',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.SENIOR_ACCOUNTANT),
    validate(deleteCoaSchema),
    coaController.deleteAccount.bind(coaController)
);

export default router;

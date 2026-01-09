import { Router } from 'express';
import { payrollController } from '@/controllers/payroll.controller';
import { validate } from '@/middlewares/validation.middleware';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import {
    createPayrollSchema,
    generatePayrollSchema,
    updatePayrollSchema,
    getPayrollByIdSchema,
    listPayrollsSchema,
    payPayrollSchema,
    deletePayrollSchema,
} from '@/validators/payroll.validator';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/payrolls
 * @desc    Create payroll (manual)
 * @access  Private (Admin/Manager)
 */
router.post(
    '/',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.MANAGER),
    validate(createPayrollSchema),
    payrollController.createPayroll.bind(payrollController)
);

/**
 * @route   POST /api/v1/payrolls/generate
 * @desc    Generate payroll (batch)
 * @access  Private (Admin/Manager)
 */
router.post(
    '/generate',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.MANAGER),
    validate(generatePayrollSchema),
    payrollController.generatePayroll.bind(payrollController)
);

/**
 * @route   GET /api/v1/payrolls
 * @desc    List payrolls
 * @access  Private
 */
router.get(
    '/',
    validate(listPayrollsSchema),
    payrollController.listPayrolls.bind(payrollController)
);

/**
 * @route   GET /api/v1/payrolls/:id
 * @desc    Get payroll by ID
 * @access  Private
 */
router.get(
    '/:id',
    validate(getPayrollByIdSchema),
    payrollController.getPayrollById.bind(payrollController)
);

/**
 * @route   PUT /api/v1/payrolls/:id
 * @desc    Update payroll (unpaid only)
 * @access  Private (Admin/Manager)
 */
router.put(
    '/:id',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.MANAGER),
    validate(updatePayrollSchema),
    payrollController.updatePayroll.bind(payrollController)
);

/**
 * @route   POST /api/v1/payrolls/:id/pay
 * @desc    Pay payroll & Auto-Journal
 * @access  Private (Admin/Manager)
 */
router.post(
    '/:id/pay',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT),
    validate(payPayrollSchema),
    payrollController.payPayroll.bind(payrollController)
);

/**
 * @route   DELETE /api/v1/payrolls/:id
 * @desc    Delete payroll (unpaid only)
 * @access  Private (Admin/Manager)
 */
router.delete(
    '/:id',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.MANAGER),
    validate(deletePayrollSchema),
    payrollController.deletePayroll.bind(payrollController)
);

export default router;

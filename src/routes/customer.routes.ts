import { Router } from 'express';
import { customerController } from '@/controllers/customer.controller';
import { validate } from '@/middlewares/validation.middleware';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import {
    createCustomerSchema,
    updateCustomerSchema,
    getCustomerByIdSchema,
    listCustomersSchema,
    getCustomerAgingSchema,
    deleteCustomerSchema,
    toggleCustomerStatusSchema,
} from '@/validators/customer.validator';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/customers
 * @desc    Create customer
 * @access  Private (Sales+)
 */
router.post(
    '/',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.SALES, Role.ACCOUNTANT, Role.SENIOR_ACCOUNTANT),
    validate(createCustomerSchema),
    customerController.createCustomer.bind(customerController)
);

/**
 * @route   GET /api/v1/customers/aging
 * @desc    Get customer aging report
 * @access  Private
 */
router.get(
    '/aging',
    validate(getCustomerAgingSchema),
    customerController.getCustomerAging.bind(customerController)
);

/**
 * @route   GET /api/v1/customers
 * @desc    List customers with pagination and filters
 * @access  Private
 */
router.get(
    '/',
    validate(listCustomersSchema),
    customerController.listCustomers.bind(customerController)
);

/**
 * @route   GET /api/v1/customers/:id
 * @desc    Get customer by ID
 * @access  Private
 */
router.get(
    '/:id',
    validate(getCustomerByIdSchema),
    customerController.getCustomerById.bind(customerController)
);

/**
 * @route   PUT /api/v1/customers/:id
 * @desc    Update customer
 * @access  Private (Sales+)
 */
router.put(
    '/:id',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.SALES, Role.ACCOUNTANT, Role.SENIOR_ACCOUNTANT),
    validate(updateCustomerSchema),
    customerController.updateCustomer.bind(customerController)
);

/**
 * @route   PUT /api/v1/customers/:id/toggle-status
 * @desc    Toggle customer status (activate/deactivate)
 * @access  Private (Admin+)
 */
router.put(
    '/:id/toggle-status',
    authorize(Role.SUPERADMIN, Role.ADMIN),
    validate(toggleCustomerStatusSchema),
    customerController.toggleCustomerStatus.bind(customerController)
);

/**
 * @route   DELETE /api/v1/customers/:id
 * @desc    Delete customer
 * @access  Private (Admin+)
 */
router.delete(
    '/:id',
    authorize(Role.SUPERADMIN, Role.ADMIN),
    validate(deleteCustomerSchema),
    customerController.deleteCustomer.bind(customerController)
);

export default router;

import { Router } from 'express';
import { supplierController } from '@/controllers/supplier.controller';
import { validate } from '@/middleware/validation.middleware';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import {
    createSupplierSchema,
    updateSupplierSchema,
    getSupplierByIdSchema,
    listSuppliersSchema,
    getSupplierAgingSchema,
    deleteSupplierSchema,
    toggleSupplierStatusSchema,
} from '@/validators/supplier.validator';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/suppliers
 * @desc    Create supplier
 * @access  Private (Purchasing+)
 */
router.post(
    '/',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.PURCHASING, Role.ACCOUNTANT, Role.SENIOR_ACCOUNTANT),
    validate(createSupplierSchema),
    supplierController.createSupplier.bind(supplierController)
);

/**
 * @route   GET /api/v1/suppliers/aging
 * @desc    Get supplier aging report
 * @access  Private
 */
router.get(
    '/aging',
    validate(getSupplierAgingSchema),
    supplierController.getSupplierAging.bind(supplierController)
);

/**
 * @route   GET /api/v1/suppliers
 * @desc    List suppliers with pagination and filters
 * @access  Private
 */
router.get(
    '/',
    validate(listSuppliersSchema),
    supplierController.listSuppliers.bind(supplierController)
);

/**
 * @route   GET /api/v1/suppliers/:id
 * @desc    Get supplier by ID
 * @access  Private
 */
router.get(
    '/:id',
    validate(getSupplierByIdSchema),
    supplierController.getSupplierById.bind(supplierController)
);

/**
 * @route   PUT /api/v1/suppliers/:id
 * @desc    Update supplier
 * @access  Private (Purchasing+)
 */
router.put(
    '/:id',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.PURCHASING, Role.ACCOUNTANT, Role.SENIOR_ACCOUNTANT),
    validate(updateSupplierSchema),
    supplierController.updateSupplier.bind(supplierController)
);

/**
 * @route   PUT /api/v1/suppliers/:id/toggle-status
 * @desc    Toggle supplier status (activate/deactivate)
 * @access  Private (Admin+)
 */
router.put(
    '/:id/toggle-status',
    authorize(Role.SUPERADMIN, Role.ADMIN),
    validate(toggleSupplierStatusSchema),
    supplierController.toggleSupplierStatus.bind(supplierController)
);

/**
 * @route   DELETE /api/v1/suppliers/:id
 * @desc    Delete supplier
 * @access  Private (Admin+)
 */
router.delete(
    '/:id',
    authorize(Role.SUPERADMIN, Role.ADMIN),
    validate(deleteSupplierSchema),
    supplierController.deleteSupplier.bind(supplierController)
);

export default router;

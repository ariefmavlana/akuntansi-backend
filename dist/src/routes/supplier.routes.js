"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supplier_controller_1 = require("../controllers/supplier.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const supplier_validator_1 = require("../validators/supplier.validator");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   POST /api/v1/suppliers
 * @desc    Create supplier
 * @access  Private (Purchasing+)
 */
router.post('/', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.PURCHASING, client_1.Role.ACCOUNTANT, client_1.Role.SENIOR_ACCOUNTANT), (0, validation_middleware_1.validate)(supplier_validator_1.createSupplierSchema), supplier_controller_1.supplierController.createSupplier.bind(supplier_controller_1.supplierController));
/**
 * @route   GET /api/v1/suppliers/aging
 * @desc    Get supplier aging report
 * @access  Private
 */
router.get('/aging', (0, validation_middleware_1.validate)(supplier_validator_1.getSupplierAgingSchema), supplier_controller_1.supplierController.getSupplierAging.bind(supplier_controller_1.supplierController));
/**
 * @route   GET /api/v1/suppliers
 * @desc    List suppliers with pagination and filters
 * @access  Private
 */
router.get('/', (0, validation_middleware_1.validate)(supplier_validator_1.listSuppliersSchema), supplier_controller_1.supplierController.listSuppliers.bind(supplier_controller_1.supplierController));
/**
 * @route   GET /api/v1/suppliers/:id
 * @desc    Get supplier by ID
 * @access  Private
 */
router.get('/:id', (0, validation_middleware_1.validate)(supplier_validator_1.getSupplierByIdSchema), supplier_controller_1.supplierController.getSupplierById.bind(supplier_controller_1.supplierController));
/**
 * @route   PUT /api/v1/suppliers/:id
 * @desc    Update supplier
 * @access  Private (Purchasing+)
 */
router.put('/:id', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.PURCHASING, client_1.Role.ACCOUNTANT, client_1.Role.SENIOR_ACCOUNTANT), (0, validation_middleware_1.validate)(supplier_validator_1.updateSupplierSchema), supplier_controller_1.supplierController.updateSupplier.bind(supplier_controller_1.supplierController));
/**
 * @route   PUT /api/v1/suppliers/:id/toggle-status
 * @desc    Toggle supplier status (activate/deactivate)
 * @access  Private (Admin+)
 */
router.put('/:id/toggle-status', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN), (0, validation_middleware_1.validate)(supplier_validator_1.toggleSupplierStatusSchema), supplier_controller_1.supplierController.toggleSupplierStatus.bind(supplier_controller_1.supplierController));
/**
 * @route   DELETE /api/v1/suppliers/:id
 * @desc    Delete supplier
 * @access  Private (Admin+)
 */
router.delete('/:id', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN), (0, validation_middleware_1.validate)(supplier_validator_1.deleteSupplierSchema), supplier_controller_1.supplierController.deleteSupplier.bind(supplier_controller_1.supplierController));
exports.default = router;

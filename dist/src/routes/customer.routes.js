"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_controller_1 = require("../controllers/customer.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const customer_validator_1 = require("../validators/customer.validator");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   POST /api/v1/customers
 * @desc    Create customer
 * @access  Private (Sales+)
 */
router.post('/', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.SALES, client_1.Role.ACCOUNTANT, client_1.Role.SENIOR_ACCOUNTANT), (0, validation_middleware_1.validate)(customer_validator_1.createCustomerSchema), customer_controller_1.customerController.createCustomer.bind(customer_controller_1.customerController));
/**
 * @route   GET /api/v1/customers/aging
 * @desc    Get customer aging report
 * @access  Private
 */
router.get('/aging', (0, validation_middleware_1.validate)(customer_validator_1.getCustomerAgingSchema), customer_controller_1.customerController.getCustomerAging.bind(customer_controller_1.customerController));
/**
 * @route   GET /api/v1/customers
 * @desc    List customers with pagination and filters
 * @access  Private
 */
router.get('/', (0, validation_middleware_1.validate)(customer_validator_1.listCustomersSchema), customer_controller_1.customerController.listCustomers.bind(customer_controller_1.customerController));
/**
 * @route   GET /api/v1/customers/:id
 * @desc    Get customer by ID
 * @access  Private
 */
router.get('/:id', (0, validation_middleware_1.validate)(customer_validator_1.getCustomerByIdSchema), customer_controller_1.customerController.getCustomerById.bind(customer_controller_1.customerController));
/**
 * @route   PUT /api/v1/customers/:id
 * @desc    Update customer
 * @access  Private (Sales+)
 */
router.put('/:id', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.SALES, client_1.Role.ACCOUNTANT, client_1.Role.SENIOR_ACCOUNTANT), (0, validation_middleware_1.validate)(customer_validator_1.updateCustomerSchema), customer_controller_1.customerController.updateCustomer.bind(customer_controller_1.customerController));
/**
 * @route   PUT /api/v1/customers/:id/toggle-status
 * @desc    Toggle customer status (activate/deactivate)
 * @access  Private (Admin+)
 */
router.put('/:id/toggle-status', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN), (0, validation_middleware_1.validate)(customer_validator_1.toggleCustomerStatusSchema), customer_controller_1.customerController.toggleCustomerStatus.bind(customer_controller_1.customerController));
/**
 * @route   DELETE /api/v1/customers/:id
 * @desc    Delete customer
 * @access  Private (Admin+)
 */
router.delete('/:id', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN), (0, validation_middleware_1.validate)(customer_validator_1.deleteCustomerSchema), customer_controller_1.customerController.deleteCustomer.bind(customer_controller_1.customerController));
exports.default = router;

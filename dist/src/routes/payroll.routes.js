"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payroll_controller_1 = require("../controllers/payroll.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const payroll_validator_1 = require("../validators/payroll.validator");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   POST /api/v1/payrolls
 * @desc    Create payroll (manual)
 * @access  Private (Admin/Manager)
 */
router.post('/', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validation_middleware_1.validate)(payroll_validator_1.createPayrollSchema), payroll_controller_1.payrollController.createPayroll.bind(payroll_controller_1.payrollController));
/**
 * @route   POST /api/v1/payrolls/generate
 * @desc    Generate payroll (batch)
 * @access  Private (Admin/Manager)
 */
router.post('/generate', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validation_middleware_1.validate)(payroll_validator_1.generatePayrollSchema), payroll_controller_1.payrollController.generatePayroll.bind(payroll_controller_1.payrollController));
/**
 * @route   GET /api/v1/payrolls
 * @desc    List payrolls
 * @access  Private
 */
router.get('/', (0, validation_middleware_1.validate)(payroll_validator_1.listPayrollsSchema), payroll_controller_1.payrollController.listPayrolls.bind(payroll_controller_1.payrollController));
/**
 * @route   GET /api/v1/payrolls/:id
 * @desc    Get payroll by ID
 * @access  Private
 */
router.get('/:id', (0, validation_middleware_1.validate)(payroll_validator_1.getPayrollByIdSchema), payroll_controller_1.payrollController.getPayrollById.bind(payroll_controller_1.payrollController));
/**
 * @route   PUT /api/v1/payrolls/:id
 * @desc    Update payroll (unpaid only)
 * @access  Private (Admin/Manager)
 */
router.put('/:id', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validation_middleware_1.validate)(payroll_validator_1.updatePayrollSchema), payroll_controller_1.payrollController.updatePayroll.bind(payroll_controller_1.payrollController));
/**
 * @route   POST /api/v1/payrolls/:id/pay
 * @desc    Pay payroll & Auto-Journal
 * @access  Private (Admin/Manager)
 */
router.post('/:id/pay', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.MANAGER, client_1.Role.ACCOUNTANT), (0, validation_middleware_1.validate)(payroll_validator_1.payPayrollSchema), payroll_controller_1.payrollController.payPayroll.bind(payroll_controller_1.payrollController));
/**
 * @route   DELETE /api/v1/payrolls/:id
 * @desc    Delete payroll (unpaid only)
 * @access  Private (Admin/Manager)
 */
router.delete('/:id', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validation_middleware_1.validate)(payroll_validator_1.deletePayrollSchema), payroll_controller_1.payrollController.deletePayroll.bind(payroll_controller_1.payrollController));
exports.default = router;

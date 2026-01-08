"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employee_controller_1 = require("../controllers/employee.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const employee_validator_1 = require("../validators/employee.validator");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   POST /api/v1/employees
 * @desc    Create new employee
 * @access  Private (Admin/Manager)
 */
router.post('/', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validation_middleware_1.validate)(employee_validator_1.createEmployeeSchema), employee_controller_1.employeeController.createEmployee.bind(employee_controller_1.employeeController));
/**
 * @route   GET /api/v1/employees
 * @desc    List employees
 * @access  Private
 */
router.get('/', (0, validation_middleware_1.validate)(employee_validator_1.listEmployeesSchema), employee_controller_1.employeeController.listEmployees.bind(employee_controller_1.employeeController));
/**
 * @route   GET /api/v1/employees/:id
 * @desc    Get employee by ID
 * @access  Private
 */
router.get('/:id', (0, validation_middleware_1.validate)(employee_validator_1.getEmployeeByIdSchema), employee_controller_1.employeeController.getEmployeeById.bind(employee_controller_1.employeeController));
/**
 * @route   PUT /api/v1/employees/:id
 * @desc    Update employee
 * @access  Private (Admin/Manager)
 */
router.put('/:id', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validation_middleware_1.validate)(employee_validator_1.updateEmployeeSchema), employee_controller_1.employeeController.updateEmployee.bind(employee_controller_1.employeeController));
/**
 * @route   DELETE /api/v1/employees/:id
 * @desc    Delete employee
 * @access  Private (Admin/Manager)
 */
router.delete('/:id', (0, auth_middleware_1.authorize)(client_1.Role.SUPERADMIN, client_1.Role.ADMIN, client_1.Role.MANAGER), (0, validation_middleware_1.validate)(employee_validator_1.deleteEmployeeSchema), employee_controller_1.employeeController.deleteEmployee.bind(employee_controller_1.employeeController));
exports.default = router;

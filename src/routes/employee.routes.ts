import { Router } from 'express';
import { employeeController } from '@/controllers/employee.controller';
import { validate } from '@/middlewares/validation.middleware';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import {
    createEmployeeSchema,
    updateEmployeeSchema,
    getEmployeeByIdSchema,
    listEmployeesSchema,
    deleteEmployeeSchema,
} from '@/validators/employee.validator';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/employees
 * @desc    Create new employee
 * @access  Private (Admin/Manager)
 */
router.post(
    '/',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.MANAGER),
    validate(createEmployeeSchema),
    employeeController.createEmployee.bind(employeeController)
);

/**
 * @route   GET /api/v1/employees
 * @desc    List employees
 * @access  Private
 */
router.get(
    '/',
    validate(listEmployeesSchema),
    employeeController.listEmployees.bind(employeeController)
);

/**
 * @route   GET /api/v1/employees/:id
 * @desc    Get employee by ID
 * @access  Private
 */
router.get(
    '/:id',
    validate(getEmployeeByIdSchema),
    employeeController.getEmployeeById.bind(employeeController)
);

/**
 * @route   PUT /api/v1/employees/:id
 * @desc    Update employee
 * @access  Private (Admin/Manager)
 */
router.put(
    '/:id',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.MANAGER),
    validate(updateEmployeeSchema),
    employeeController.updateEmployee.bind(employeeController)
);

/**
 * @route   DELETE /api/v1/employees/:id
 * @desc    Delete employee
 * @access  Private (Admin/Manager)
 */
router.delete(
    '/:id',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.MANAGER),
    validate(deleteEmployeeSchema),
    employeeController.deleteEmployee.bind(employeeController)
);

export default router;

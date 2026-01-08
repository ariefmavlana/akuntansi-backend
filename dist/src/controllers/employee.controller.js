"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeController = exports.EmployeeController = void 0;
const employee_service_1 = require("../services/employee.service");
const response_1 = require("../utils/response");
/**
 * Employee Controller
 * Handles HTTP requests for employee management endpoints
 */
class EmployeeController {
    /**
     * Create new employee
     * POST /api/v1/employees
     */
    async createEmployee(req, res, next) {
        try {
            const employee = await employee_service_1.employeeService.createEmployee(req.body);
            (0, response_1.createdResponse)(res, employee, 'Karyawan berhasil ditambahkan');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * List employees with pagination and filters
     * GET /api/v1/employees
     */
    async listEmployees(req, res, next) {
        try {
            const result = await employee_service_1.employeeService.listEmployees(req.query);
            (0, response_1.successResponse)(res, result.data, 'Data karyawan berhasil diambil', 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get employee by ID
     * GET /api/v1/employees/:id
     */
    async getEmployeeById(req, res, next) {
        try {
            const employee = await employee_service_1.employeeService.getEmployeeById(req.params.id);
            if (!employee) {
                res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan' });
                return;
            }
            (0, response_1.successResponse)(res, employee, 'Data karyawan berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update employee
     * PUT /api/v1/employees/:id
     */
    async updateEmployee(req, res, next) {
        try {
            const employee = await employee_service_1.employeeService.updateEmployee(req.params.id, req.body);
            (0, response_1.successResponse)(res, employee, 'Data karyawan berhasil diupdate');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete employee
     * DELETE /api/v1/employees/:id
     */
    async deleteEmployee(req, res, next) {
        try {
            await employee_service_1.employeeService.deleteEmployee(req.params.id);
            (0, response_1.successResponse)(res, null, 'Karyawan berhasil dihapus');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.EmployeeController = EmployeeController;
exports.employeeController = new EmployeeController();

import { Request, Response, NextFunction } from 'express';
import { employeeService } from '@/services/employee.service';
import { successResponse, createdResponse } from '@/utils/response';

/**
 * Employee Controller
 * Handles HTTP requests for employee management endpoints
 */
export class EmployeeController {
    /**
     * Create new employee
     * POST /api/v1/employees
     */
    async createEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const employee = await employeeService.createEmployee(req.body);
            createdResponse(res, employee, 'Karyawan berhasil ditambahkan');
        } catch (error) {
            next(error);
        }
    }

    /**
     * List employees with pagination and filters
     * GET /api/v1/employees
     */
    async listEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await employeeService.listEmployees(req.query as any);
            successResponse(res, result.data, 'Data karyawan berhasil diambil', 200, result.meta);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get employee by ID
     * GET /api/v1/employees/:id
     */
    async getEmployeeById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const employee = await employeeService.getEmployeeById(req.params.id);
            if (!employee) {
                res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan' });
                return;
            }
            successResponse(res, employee, 'Data karyawan berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update employee
     * PUT /api/v1/employees/:id
     */
    async updateEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const employee = await employeeService.updateEmployee(req.params.id, req.body);
            successResponse(res, employee, 'Data karyawan berhasil diupdate');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete employee
     * DELETE /api/v1/employees/:id
     */
    async deleteEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await employeeService.deleteEmployee(req.params.id);
            successResponse(res, null, 'Karyawan berhasil dihapus');
        } catch (error) {
            next(error);
        }
    }
}

export const employeeController = new EmployeeController();

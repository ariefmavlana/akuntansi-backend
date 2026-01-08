"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeService = exports.EmployeeService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const client_1 = require("@prisma/client");
const auth_service_1 = require("./auth.service");
/**
 * Employee Service
 * Handles employee management
 */
class EmployeeService {
    /**
     * Create new employee
     */
    async createEmployee(data) {
        try {
            // Check if NIK already exists
            const existingEmployee = await database_1.default.karyawan.findUnique({
                where: {
                    perusahaanId_nik: {
                        perusahaanId: data.perusahaanId,
                        nik: data.nik,
                    },
                },
            });
            if (existingEmployee) {
                throw new auth_service_1.ValidationError('NIK sudah digunakan');
            }
            const employee = await database_1.default.karyawan.create({
                data: {
                    ...data,
                    tanggalMasuk: new Date(data.tanggalMasuk),
                    ...(data.tanggalLahir && { tanggalLahir: new Date(data.tanggalLahir) }),
                    // Remove email if empty string to avoid unique constraint issues if any (though mapped as optional string in prisma, check schema)
                    // Schema: email String? -> nullable. If validator allows empty string, we should convert to null or undefined?
                    // Validator: z.literal('') allowed.
                    email: data.email === '' ? null : data.email,
                },
            });
            logger_1.default.info(`Employee created: ${employee.nama} (${employee.nik})`);
            return employee;
        }
        catch (error) {
            logger_1.default.error('Create employee error:', error);
            throw error;
        }
    }
    /**
     * Get employee by ID
     */
    async getEmployeeById(id) {
        try {
            const employee = await database_1.default.karyawan.findUnique({
                where: { id },
                include: {
                    penggajian: {
                        take: 5,
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });
            return employee;
        }
        catch (error) {
            logger_1.default.error('Get employee by ID error:', error);
            throw error;
        }
    }
    /**
     * List employees
     */
    async listEmployees(query) {
        try {
            const { page = 1, limit = 20, search, ...filter } = query;
            const skip = (page - 1) * limit;
            const where = {
                ...filter,
            };
            if (search) {
                where.OR = [
                    { nik: { contains: search, mode: 'insensitive' } },
                    { nama: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ];
            }
            const [data, total] = await Promise.all([
                database_1.default.karyawan.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { nama: 'asc' },
                }),
                database_1.default.karyawan.count({ where }),
            ]);
            return {
                data,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                }
            };
        }
        catch (error) {
            logger_1.default.error('List employees error:', error);
            throw error;
        }
    }
    /**
     * Update employee
     */
    async updateEmployee(id, data) {
        try {
            const employee = await database_1.default.karyawan.findUnique({ where: { id } });
            if (!employee)
                throw new auth_service_1.ValidationError('Karyawan tidak ditemukan');
            const updated = await database_1.default.karyawan.update({
                where: { id },
                data: {
                    ...data,
                    ...(data.tanggalMasuk && { tanggalMasuk: new Date(data.tanggalMasuk) }),
                    ...(data.tanggalLahir && { tanggalLahir: new Date(data.tanggalLahir) }),
                    ...(data.tanggalKeluar && { tanggalKeluar: new Date(data.tanggalKeluar) }),
                    ...(data.email === '' ? { email: null } : {}),
                },
            });
            logger_1.default.info(`Employee updated: ${updated.nik}`);
            return updated;
        }
        catch (error) {
            logger_1.default.error('Update employee error:', error);
            throw error;
        }
    }
    /**
     * Delete employee
     */
    async deleteEmployee(id) {
        try {
            const employee = await database_1.default.karyawan.findUnique({ where: { id } });
            if (!employee)
                throw new auth_service_1.ValidationError('Karyawan tidak ditemukan');
            const deleted = await database_1.default.karyawan.delete({
                where: { id },
            });
            logger_1.default.info(`Employee deleted: ${deleted.nik}`);
            return deleted;
        }
        catch (error) {
            logger_1.default.error('Delete employee error:', error);
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
                throw new auth_service_1.ValidationError('Tidak dapat menghapus karyawan yang memiliki data penggajian');
            }
            throw error;
        }
    }
}
exports.EmployeeService = EmployeeService;
exports.employeeService = new EmployeeService();

import prisma from '@/config/database';
import logger from '@/utils/logger';
import { Karyawan, Prisma } from '@prisma/client';
import {
    CreateEmployeeInput,
    UpdateEmployeeInput,
    ListEmployeesInput,
} from '@/validators/employee.validator';
import { ValidationError } from './auth.service';

/**
 * Employee Service
 * Handles employee management
 */
export class EmployeeService {
    /**
     * Create new employee
     */
    async createEmployee(data: CreateEmployeeInput): Promise<Karyawan> {
        try {
            // Check if NIK already exists
            const existingEmployee = await prisma.karyawan.findUnique({
                where: {
                    perusahaanId_nik: {
                        perusahaanId: data.perusahaanId,
                        nik: data.nik,
                    },
                },
            });

            if (existingEmployee) {
                throw new ValidationError('NIK sudah digunakan');
            }

            const employee = await prisma.karyawan.create({
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

            logger.info(`Employee created: ${employee.nama} (${employee.nik})`);
            return employee;
        } catch (error) {
            logger.error('Create employee error:', error);
            throw error;
        }
    }

    /**
     * Get employee by ID
     */
    async getEmployeeById(id: string): Promise<Karyawan | null> {
        try {
            const employee = await prisma.karyawan.findUnique({
                where: { id },
                include: {
                    penggajian: {
                        take: 5,
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });
            return employee;
        } catch (error) {
            logger.error('Get employee by ID error:', error);
            throw error;
        }
    }

    /**
     * List employees
     */
    async listEmployees(query: ListEmployeesInput): Promise<{
        data: Karyawan[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        }
    }> {
        try {
            const { page = 1, limit = 20, search, ...filter } = query;
            const skip = (page - 1) * limit;

            const where: Prisma.KaryawanWhereInput = {
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
                prisma.karyawan.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { nama: 'asc' },
                }),
                prisma.karyawan.count({ where }),
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
        } catch (error) {
            logger.error('List employees error:', error);
            throw error;
        }
    }

    /**
     * Update employee
     */
    async updateEmployee(id: string, data: UpdateEmployeeInput['body']): Promise<Karyawan> {
        try {
            const employee = await prisma.karyawan.findUnique({ where: { id } });
            if (!employee) throw new ValidationError('Karyawan tidak ditemukan');

            const updated = await prisma.karyawan.update({
                where: { id },
                data: {
                    ...data,
                    ...(data.tanggalMasuk && { tanggalMasuk: new Date(data.tanggalMasuk) }),
                    ...(data.tanggalLahir && { tanggalLahir: new Date(data.tanggalLahir) }),
                    ...(data.tanggalKeluar && { tanggalKeluar: new Date(data.tanggalKeluar) }),
                    ...(data.email === '' ? { email: null } : {}),
                },
            });

            logger.info(`Employee updated: ${updated.nik}`);
            return updated;
        } catch (error) {
            logger.error('Update employee error:', error);
            throw error;
        }
    }

    /**
     * Delete employee
     */
    async deleteEmployee(id: string): Promise<Karyawan> {
        try {
            const employee = await prisma.karyawan.findUnique({ where: { id } });
            if (!employee) throw new ValidationError('Karyawan tidak ditemukan');

            const deleted = await prisma.karyawan.delete({
                where: { id },
            });

            logger.info(`Employee deleted: ${deleted.nik}`);
            return deleted;
        } catch (error) {
            logger.error('Delete employee error:', error);
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
                throw new ValidationError('Tidak dapat menghapus karyawan yang memiliki data penggajian');
            }
            throw error;
        }
    }
}

export const employeeService = new EmployeeService();

import prisma from '@/config/database';
import logger from '@/utils/logger';
import { Pelanggan, Prisma } from '@prisma/client';
import type {
    CreateCustomerInput,
    ListCustomersInput,
    GetCustomerAgingInput,
} from '@/validators/customer.validator';
import { AuthenticationError, ValidationError } from './auth.service';

/**
 * Customer Service
 * Handles customer management with credit limit and aging reports
 */
export class CustomerService {
    /**
     * Generate customer code
     */
    private async generateCustomerCode(perusahaanId: string): Promise<string> {
        const count = await prisma.pelanggan.count({
            where: { perusahaanId },
        });

        const sequence = String(count + 1).padStart(4, '0');
        return `CUST-${sequence}`;
    }

    /**
     * Create customer
     */
    async createCustomer(data: CreateCustomerInput, requestingUserId: string): Promise<Pelanggan> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === data.perusahaanId;
            const canCreate = ['ADMIN', 'SALES', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(
                requestingUser.role
            );

            if (!isSuperAdmin && !(isOwnCompany && canCreate)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk membuat pelanggan');
            }

            // Generate customer code if not provided
            const kodePelanggan =
                data.kodePelanggan || (await this.generateCustomerCode(data.perusahaanId));

            // Check if customer code already exists
            const existing = await prisma.pelanggan.findFirst({
                where: {
                    perusahaanId: data.perusahaanId,
                    kodePelanggan,
                },
            });

            if (existing) {
                throw new ValidationError('Kode pelanggan sudah digunakan');
            }

            // Create customer
            const customer = await prisma.pelanggan.create({
                data: {
                    perusahaanId: data.perusahaanId,
                    kodePelanggan,
                    nama: data.nama,
                    namaPerusahaan: data.namaPerusahaan,
                    tipe: data.tipe || 'INDIVIDUAL',
                    alamat: data.alamat,
                    kota: data.kota,
                    provinsi: data.provinsi,
                    kodePos: data.kodePos,
                    telepon: data.telepon,
                    email: data.email,
                    website: data.website,
                    npwp: data.npwp,
                    nik: data.nik,
                    kontakPerson: data.kontakPerson,
                    teleponKontak: data.teleponKontak,
                    batasKredit: data.batasKredit || 0,
                    termPembayaran: data.termPembayaran || 30,
                    kategori: data.kategori,
                    grup: data.grup,
                    salesPerson: data.salesPerson,
                    catatan: data.catatan,
                },
            });

            logger.info(`Customer created: ${customer.kodePelanggan} by ${requestingUser.email}`);

            return customer;
        } catch (error) {
            logger.error('Create customer error:', error);
            throw error;
        }
    }

    /**
     * Get customer by ID
     */
    async getCustomerById(customerId: string, requestingUserId: string): Promise<Pelanggan> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const customer = await prisma.pelanggan.findUnique({
                where: { id: customerId },
                include: {
                    transaksi: {
                        select: {
                            id: true,
                            nomorTransaksi: true,
                            tanggal: true,
                            total: true,
                            statusPembayaran: true,
                        },
                        orderBy: { tanggal: 'desc' },
                        take: 10,
                    },
                },
            });

            if (!customer) {
                throw new ValidationError('Pelanggan tidak ditemukan');
            }

            // Check permissions
            if (
                requestingUser.role !== 'SUPERADMIN' &&
                requestingUser.perusahaanId !== customer.perusahaanId
            ) {
                throw new AuthenticationError('Anda tidak memiliki akses ke pelanggan ini');
            }

            return customer;
        } catch (error) {
            logger.error('Get customer by ID error:', error);
            throw error;
        }
    }

    /**
     * List customers with pagination and filters
     */
    async listCustomers(filters: ListCustomersInput, requestingUserId: string) {
        try {
            const {
                page = 1,
                limit = 20,
                perusahaanId,
                search,
                tipe,
                kategori,
                grup,
                isAktif,
            } = filters;

            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            // Build where clause
            const where: Prisma.PelangganWhereInput = {};

            // Non-SUPERADMIN can only see their company's customers
            if (requestingUser.role !== 'SUPERADMIN') {
                where.perusahaanId = requestingUser.perusahaanId;
            } else if (perusahaanId) {
                where.perusahaanId = perusahaanId;
            }

            if (tipe) {
                where.tipe = tipe;
            }

            if (kategori) {
                where.kategori = kategori;
            }

            if (grup) {
                where.grup = grup;
            }

            if (isAktif !== undefined) {
                where.isAktif = isAktif;
            }

            if (search) {
                where.OR = [
                    { kodePelanggan: { contains: search, mode: 'insensitive' } },
                    { nama: { contains: search, mode: 'insensitive' } },
                    { namaPerusahaan: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ];
            }

            // Get total count
            const total = await prisma.pelanggan.count({ where });

            // Get customers
            const customers = await prisma.pelanggan.findMany({
                where,
                select: {
                    id: true,
                    kodePelanggan: true,
                    nama: true,
                    namaPerusahaan: true,
                    tipe: true,
                    email: true,
                    telepon: true,
                    batasKredit: true,
                    termPembayaran: true,
                    kategori: true,
                    grup: true,
                    isAktif: true,
                    createdAt: true,
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { nama: 'asc' },
            });

            return {
                data: customers,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('List customers error:', error);
            throw error;
        }
    }

    /**
     * Update customer
     */
    async updateCustomer(
        customerId: string,
        data: Partial<CreateCustomerInput>,
        requestingUserId: string
    ): Promise<Pelanggan> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const customer = await prisma.pelanggan.findUnique({
                where: { id: customerId },
            });

            if (!customer) {
                throw new ValidationError('Pelanggan tidak ditemukan');
            }

            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === customer.perusahaanId;
            const canUpdate = ['ADMIN', 'SALES', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(
                requestingUser.role
            );

            if (!isSuperAdmin && !(isOwnCompany && canUpdate)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk mengupdate pelanggan ini');
            }

            // Update customer
            const updatedCustomer = await prisma.pelanggan.update({
                where: { id: customerId },
                data: {
                    nama: data.nama,
                    namaPerusahaan: data.namaPerusahaan,
                    tipe: data.tipe,
                    alamat: data.alamat,
                    kota: data.kota,
                    provinsi: data.provinsi,
                    kodePos: data.kodePos,
                    telepon: data.telepon,
                    email: data.email,
                    website: data.website,
                    npwp: data.npwp,
                    nik: data.nik,
                    kontakPerson: data.kontakPerson,
                    teleponKontak: data.teleponKontak,
                    batasKredit: data.batasKredit,
                    termPembayaran: data.termPembayaran,
                    kategori: data.kategori,
                    grup: data.grup,
                    salesPerson: data.salesPerson,
                    catatan: data.catatan,
                },
            });

            logger.info(`Customer updated: ${updatedCustomer.kodePelanggan} by ${requestingUser.email}`);

            return updatedCustomer;
        } catch (error) {
            logger.error('Update customer error:', error);
            throw error;
        }
    }

    /**
     * Get customer aging report
     */
    async getCustomerAging(filters: GetCustomerAgingInput, requestingUserId: string) {
        try {
            const { perusahaanId, customerId, tanggal } = filters;

            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            // Check permissions
            if (requestingUser.role !== 'SUPERADMIN' && requestingUser.perusahaanId !== perusahaanId) {
                throw new AuthenticationError('Anda tidak memiliki akses ke data perusahaan ini');
            }

            const asOfDate = tanggal ? (typeof tanggal === 'string' ? new Date(tanggal) : tanggal) : new Date();

            // Build where clause
            const where: Prisma.TransaksiWhereInput = {
                perusahaanId,
                statusPembayaran: { not: 'LUNAS' },
                tanggalJatuhTempo: { lte: asOfDate },
            };

            if (customerId) {
                where.pelangganId = customerId;
            }

            // Get unpaid transactions
            const transactions = await prisma.transaksi.findMany({
                where,
                include: {
                    pelanggan: {
                        select: {
                            id: true,
                            kodePelanggan: true,
                            nama: true,
                            batasKredit: true,
                        },
                    },
                },
                orderBy: { tanggalJatuhTempo: 'asc' },
            });

            // Group by customer and calculate aging
            const agingByCustomer = transactions.reduce((acc, trans) => {
                if (!trans.pelanggan) return acc;

                const key = trans.pelanggan.id;
                if (!acc[key]) {
                    acc[key] = {
                        customer: trans.pelanggan,
                        current: 0,
                        days1to30: 0,
                        days31to60: 0,
                        days61to90: 0,
                        over90: 0,
                        total: 0,
                    };
                }

                const daysOverdue = Math.floor(
                    (asOfDate.getTime() - trans.tanggalJatuhTempo!.getTime()) / (1000 * 60 * 60 * 24)
                );
                const amount = trans.sisaPembayaran.toNumber();

                if (daysOverdue <= 0) {
                    acc[key].current += amount;
                } else if (daysOverdue <= 30) {
                    acc[key].days1to30 += amount;
                } else if (daysOverdue <= 60) {
                    acc[key].days31to60 += amount;
                } else if (daysOverdue <= 90) {
                    acc[key].days61to90 += amount;
                } else {
                    acc[key].over90 += amount;
                }

                acc[key].total += amount;

                return acc;
            }, {} as Record<string, any>);

            return Object.values(agingByCustomer);
        } catch (error) {
            logger.error('Get customer aging error:', error);
            throw error;
        }
    }

    /**
     * Toggle customer status (activate/deactivate)
     */
    async toggleCustomerStatus(customerId: string, requestingUserId: string): Promise<Pelanggan> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const customer = await prisma.pelanggan.findUnique({
                where: { id: customerId },
            });

            if (!customer) {
                throw new ValidationError('Pelanggan tidak ditemukan');
            }

            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === customer.perusahaanId;
            const canUpdate = ['ADMIN'].includes(requestingUser.role);

            if (!isSuperAdmin && !(isOwnCompany && canUpdate)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk mengubah status pelanggan');
            }

            // Toggle status
            const updatedCustomer = await prisma.pelanggan.update({
                where: { id: customerId },
                data: {
                    isAktif: !customer.isAktif,
                },
            });

            logger.info(
                `Customer status toggled: ${updatedCustomer.kodePelanggan} -> ${updatedCustomer.isAktif} by ${requestingUser.email}`
            );

            return updatedCustomer;
        } catch (error) {
            logger.error('Toggle customer status error:', error);
            throw error;
        }
    }

    /**
     * Delete customer
     */
    async deleteCustomer(customerId: string, requestingUserId: string): Promise<void> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const customer = await prisma.pelanggan.findUnique({
                where: { id: customerId },
                include: {
                    transaksi: true,
                },
            });

            if (!customer) {
                throw new ValidationError('Pelanggan tidak ditemukan');
            }

            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === customer.perusahaanId;
            const canDelete = ['ADMIN'].includes(requestingUser.role);

            if (!isSuperAdmin && !(isOwnCompany && canDelete)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk menghapus pelanggan ini');
            }

            // Cannot delete if has transactions
            if (customer.transaksi.length > 0) {
                throw new ValidationError(
                    'Tidak dapat menghapus pelanggan yang sudah memiliki transaksi. Nonaktifkan saja.'
                );
            }

            // Delete customer
            await prisma.pelanggan.delete({
                where: { id: customerId },
            });

            logger.info(`Customer deleted: ${customer.kodePelanggan} by ${requestingUser.email}`);
        } catch (error) {
            logger.error('Delete customer error:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const customerService = new CustomerService();

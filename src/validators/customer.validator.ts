import { z } from 'zod';

// Create customer schema
export const createCustomerSchema = z.object({
    body: z.object({
        perusahaanId: z.string().cuid('Perusahaan ID tidak valid'),
        kodePelanggan: z.string().min(1, 'Kode pelanggan wajib diisi').optional(), // Auto-generated if not provided
        nama: z.string().min(1, 'Nama pelanggan wajib diisi'),
        namaPerusahaan: z.string().optional(),
        tipe: z.enum(['INDIVIDUAL', 'PERUSAHAAN']).default('INDIVIDUAL'),
        alamat: z.string().optional(),
        kota: z.string().optional(),
        provinsi: z.string().optional(),
        kodePos: z.string().optional(),
        telepon: z.string().optional(),
        email: z.string().email('Format email tidak valid').optional(),
        website: z.string().url('Format website tidak valid').optional().or(z.literal('')),
        npwp: z.string().optional(),
        nik: z.string().optional(),
        kontakPerson: z.string().optional(),
        teleponKontak: z.string().optional(),
        batasKredit: z.number().min(0).default(0),
        termPembayaran: z.number().int().min(0).default(30),
        kategori: z.string().optional(),
        grup: z.string().optional(),
        salesPerson: z.string().optional(),
        catatan: z.string().optional(),
    }),
});

// Update customer schema
export const updateCustomerSchema = z.object({
    params: z.object({
        id: z.string().cuid('Customer ID tidak valid'),
    }),
    body: z.object({
        nama: z.string().min(1).optional(),
        namaPerusahaan: z.string().optional(),
        tipe: z.enum(['INDIVIDUAL', 'PERUSAHAAN']).optional(),
        alamat: z.string().optional(),
        kota: z.string().optional(),
        provinsi: z.string().optional(),
        kodePos: z.string().optional(),
        telepon: z.string().optional(),
        email: z.string().email().optional(),
        website: z.string().url().optional().or(z.literal('')),
        npwp: z.string().optional(),
        nik: z.string().optional(),
        kontakPerson: z.string().optional(),
        teleponKontak: z.string().optional(),
        batasKredit: z.number().min(0).optional(),
        termPembayaran: z.number().int().min(0).optional(),
        kategori: z.string().optional(),
        grup: z.string().optional(),
        salesPerson: z.string().optional(),
        catatan: z.string().optional(),
    }),
});

// Get customer by ID schema
export const getCustomerByIdSchema = z.object({
    params: z.object({
        id: z.string().cuid('Customer ID tidak valid'),
    }),
});

// List customers schema
export const listCustomersSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        perusahaanId: z.string().cuid().optional(),
        search: z.string().optional(),
        tipe: z.enum(['INDIVIDUAL', 'PERUSAHAAN']).optional(),
        kategori: z.string().optional(),
        grup: z.string().optional(),
        isAktif: z
            .string()
            .transform((val) => val === 'true')
            .optional(),
    }),
});

// Get customer aging schema
export const getCustomerAgingSchema = z.object({
    query: z.object({
        perusahaanId: z.string().cuid('Perusahaan ID tidak valid'),
        customerId: z.string().cuid().optional(),
        tanggal: z.string().datetime().or(z.date()).optional(),
    }),
});

// Delete customer schema
export const deleteCustomerSchema = z.object({
    params: z.object({
        id: z.string().cuid('Customer ID tidak valid'),
    }),
});

// Activate/Deactivate customer schema
export const toggleCustomerStatusSchema = z.object({
    params: z.object({
        id: z.string().cuid('Customer ID tidak valid'),
    }),
});

// TypeScript types
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>['body'];
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type GetCustomerByIdInput = z.infer<typeof getCustomerByIdSchema>['params'];
export type ListCustomersInput = z.infer<typeof listCustomersSchema>['query'];
export type GetCustomerAgingInput = z.infer<typeof getCustomerAgingSchema>['query'];
export type DeleteCustomerInput = z.infer<typeof deleteCustomerSchema>['params'];
export type ToggleCustomerStatusInput = z.infer<typeof toggleCustomerStatusSchema>['params'];

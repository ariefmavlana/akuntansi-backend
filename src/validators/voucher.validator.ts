import { z } from 'zod';
import { TipeVoucher, StatusVoucher } from '@prisma/client';

// Voucher detail schema (for nested creation)
const voucherDetailSchema = z.object({
    urutan: z.number().int().min(1),
    akunId: z.string().cuid('Akun ID tidak valid'),
    deskripsi: z.string().optional(),
    debit: z.number().min(0).default(0),
    kredit: z.number().min(0).default(0),
    costCenterId: z.string().cuid().optional(),
    profitCenterId: z.string().cuid().optional(),
}).refine(
    (data) => (data.debit > 0 && data.kredit === 0) || (data.kredit > 0 && data.debit === 0),
    { message: 'Detail harus memiliki debit ATAU kredit, tidak boleh keduanya' }
);

// Create voucher schema
export const createVoucherSchema = z.object({
    body: z.object({
        perusahaanId: z.string().cuid('Perusahaan ID tidak valid'),
        tipe: z.nativeEnum(TipeVoucher, { errorMap: () => ({ message: 'Tipe voucher tidak valid' }) }),
        nomorVoucher: z.string().min(1, 'Nomor voucher wajib diisi').optional(), // Auto-generated if not provided
        tanggal: z.string().datetime('Format tanggal tidak valid').or(z.date()),
        transaksiId: z.string().cuid().optional(),
        deskripsi: z.string().min(1, 'Deskripsi wajib diisi'),
        catatan: z.string().optional(),
        lampiran: z.string().optional(),
        detail: z.array(voucherDetailSchema).min(2, 'Minimal 2 detail voucher diperlukan (debit dan kredit)'),
    }).refine(
        (data) => {
            const totalDebit = data.detail.reduce((sum, d) => sum + d.debit, 0);
            const totalKredit = data.detail.reduce((sum, d) => sum + d.kredit, 0);
            return Math.abs(totalDebit - totalKredit) < 0.01; // Allow small floating point differences
        },
        { message: 'Total debit dan kredit harus balance (sama)' }
    ),
});

// Update voucher schema (only for DRAFT status)
export const updateVoucherSchema = z.object({
    params: z.object({
        id: z.string().cuid('Voucher ID tidak valid'),
    }),
    body: z.object({
        tanggal: z.string().datetime().or(z.date()).optional(),
        deskripsi: z.string().min(1).optional(),
        catatan: z.string().optional(),
        lampiran: z.string().optional(),
        detail: z.array(voucherDetailSchema).min(2).optional(),
    }).refine(
        (data) => {
            if (!data.detail) return true;
            const totalDebit = data.detail.reduce((sum, d) => sum + d.debit, 0);
            const totalKredit = data.detail.reduce((sum, d) => sum + d.kredit, 0);
            return Math.abs(totalDebit - totalKredit) < 0.01;
        },
        { message: 'Total debit dan kredit harus balance (sama)' }
    ),
});

// Get voucher by ID schema
export const getVoucherByIdSchema = z.object({
    params: z.object({
        id: z.string().cuid('Voucher ID tidak valid'),
    }),
});

// List vouchers schema
export const listVouchersSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        perusahaanId: z.string().cuid().optional(),
        tipe: z.nativeEnum(TipeVoucher).optional(),
        status: z.nativeEnum(StatusVoucher).optional(),
        search: z.string().optional(),
        tanggalMulai: z.string().datetime().or(z.date()).optional(),
        tanggalAkhir: z.string().datetime().or(z.date()).optional(),
        isPosted: z
            .string()
            .transform((val) => val === 'true')
            .optional(),
    }),
});

// Approve voucher schema
export const approveVoucherSchema = z.object({
    params: z.object({
        id: z.string().cuid('Voucher ID tidak valid'),
    }),
    body: z.object({
        catatan: z.string().optional(),
    }),
});

// Reject voucher schema
export const rejectVoucherSchema = z.object({
    params: z.object({
        id: z.string().cuid('Voucher ID tidak valid'),
    }),
    body: z.object({
        alasan: z.string().min(1, 'Alasan penolakan wajib diisi'),
    }),
});

// Post voucher schema
export const postVoucherSchema = z.object({
    params: z.object({
        id: z.string().cuid('Voucher ID tidak valid'),
    }),
    body: z.object({
        tanggalPosting: z.string().datetime().or(z.date()).optional(),
    }),
});

// Reverse voucher schema
export const reverseVoucherSchema = z.object({
    params: z.object({
        id: z.string().cuid('Voucher ID tidak valid'),
    }),
    body: z.object({
        alasan: z.string().min(1, 'Alasan reversal wajib diisi'),
        tanggalReversal: z.string().datetime().or(z.date()).optional(),
    }),
});

// Delete voucher schema
export const deleteVoucherSchema = z.object({
    params: z.object({
        id: z.string().cuid('Voucher ID tidak valid'),
    }),
});

// TypeScript types
export type CreateVoucherInput = z.infer<typeof createVoucherSchema>['body'];
export type UpdateVoucherInput = {
    params: z.infer<typeof updateVoucherSchema>['params'];
    body: z.infer<typeof updateVoucherSchema>['body'];
};
export type GetVoucherByIdInput = z.infer<typeof getVoucherByIdSchema>['params'];
export type ListVouchersInput = z.infer<typeof listVouchersSchema>['query'];
export type ApproveVoucherInput = {
    params: z.infer<typeof approveVoucherSchema>['params'];
    body: z.infer<typeof approveVoucherSchema>['body'];
};
export type RejectVoucherInput = {
    params: z.infer<typeof rejectVoucherSchema>['params'];
    body: z.infer<typeof rejectVoucherSchema>['body'];
};
export type PostVoucherInput = {
    params: z.infer<typeof postVoucherSchema>['params'];
    body: z.infer<typeof postVoucherSchema>['body'];
};
export type ReverseVoucherInput = {
    params: z.infer<typeof reverseVoucherSchema>['params'];
    body: z.infer<typeof reverseVoucherSchema>['body'];
};
export type DeleteVoucherInput = z.infer<typeof deleteVoucherSchema>['params'];
export type VoucherDetailInput = z.infer<typeof voucherDetailSchema>;

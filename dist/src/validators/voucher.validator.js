"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVoucherSchema = exports.reverseVoucherSchema = exports.postVoucherSchema = exports.rejectVoucherSchema = exports.approveVoucherSchema = exports.listVouchersSchema = exports.getVoucherByIdSchema = exports.updateVoucherSchema = exports.createVoucherSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// Voucher detail schema (for nested creation)
const voucherDetailSchema = zod_1.z.object({
    urutan: zod_1.z.number().int().min(1),
    akunId: zod_1.z.string().cuid('Akun ID tidak valid'),
    deskripsi: zod_1.z.string().optional(),
    debit: zod_1.z.number().min(0).default(0),
    kredit: zod_1.z.number().min(0).default(0),
    costCenterId: zod_1.z.string().cuid().optional(),
    profitCenterId: zod_1.z.string().cuid().optional(),
}).refine((data) => (data.debit > 0 && data.kredit === 0) || (data.kredit > 0 && data.debit === 0), { message: 'Detail harus memiliki debit ATAU kredit, tidak boleh keduanya' });
// Create voucher schema
exports.createVoucherSchema = zod_1.z.object({
    body: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid('Perusahaan ID tidak valid'),
        tipe: zod_1.z.nativeEnum(client_1.TipeVoucher, { errorMap: () => ({ message: 'Tipe voucher tidak valid' }) }),
        nomorVoucher: zod_1.z.string().min(1, 'Nomor voucher wajib diisi').optional(), // Auto-generated if not provided
        tanggal: zod_1.z.string().datetime('Format tanggal tidak valid').or(zod_1.z.date()),
        transaksiId: zod_1.z.string().cuid().optional(),
        deskripsi: zod_1.z.string().min(1, 'Deskripsi wajib diisi'),
        catatan: zod_1.z.string().optional(),
        lampiran: zod_1.z.string().optional(),
        detail: zod_1.z.array(voucherDetailSchema).min(2, 'Minimal 2 detail voucher diperlukan (debit dan kredit)'),
    }).refine((data) => {
        const totalDebit = data.detail.reduce((sum, d) => sum + d.debit, 0);
        const totalKredit = data.detail.reduce((sum, d) => sum + d.kredit, 0);
        return Math.abs(totalDebit - totalKredit) < 0.01; // Allow small floating point differences
    }, { message: 'Total debit dan kredit harus balance (sama)' }),
});
// Update voucher schema (only for DRAFT status)
exports.updateVoucherSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Voucher ID tidak valid'),
    }),
    body: zod_1.z.object({
        tanggal: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        deskripsi: zod_1.z.string().min(1).optional(),
        catatan: zod_1.z.string().optional(),
        lampiran: zod_1.z.string().optional(),
        detail: zod_1.z.array(voucherDetailSchema).min(2).optional(),
    }).refine((data) => {
        if (!data.detail)
            return true;
        const totalDebit = data.detail.reduce((sum, d) => sum + d.debit, 0);
        const totalKredit = data.detail.reduce((sum, d) => sum + d.kredit, 0);
        return Math.abs(totalDebit - totalKredit) < 0.01;
    }, { message: 'Total debit dan kredit harus balance (sama)' }),
});
// Get voucher by ID schema
exports.getVoucherByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Voucher ID tidak valid'),
    }),
});
// List vouchers schema
exports.listVouchersSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        perusahaanId: zod_1.z.string().cuid().optional(),
        tipe: zod_1.z.nativeEnum(client_1.TipeVoucher).optional(),
        status: zod_1.z.nativeEnum(client_1.StatusVoucher).optional(),
        search: zod_1.z.string().optional(),
        tanggalMulai: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        tanggalAkhir: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        isPosted: zod_1.z
            .string()
            .transform((val) => val === 'true')
            .optional(),
    }),
});
// Approve voucher schema
exports.approveVoucherSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Voucher ID tidak valid'),
    }),
    body: zod_1.z.object({
        catatan: zod_1.z.string().optional(),
    }),
});
// Reject voucher schema
exports.rejectVoucherSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Voucher ID tidak valid'),
    }),
    body: zod_1.z.object({
        alasan: zod_1.z.string().min(1, 'Alasan penolakan wajib diisi'),
    }),
});
// Post voucher schema
exports.postVoucherSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Voucher ID tidak valid'),
    }),
    body: zod_1.z.object({
        tanggalPosting: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    }),
});
// Reverse voucher schema
exports.reverseVoucherSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Voucher ID tidak valid'),
    }),
    body: zod_1.z.object({
        alasan: zod_1.z.string().min(1, 'Alasan reversal wajib diisi'),
        tanggalReversal: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    }),
});
// Delete voucher schema
exports.deleteVoucherSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Voucher ID tidak valid'),
    }),
});

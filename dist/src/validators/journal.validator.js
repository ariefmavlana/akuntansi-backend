"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteJournalSchema = exports.getTrialBalanceSchema = exports.getGeneralLedgerSchema = exports.listJournalsSchema = exports.getJournalByIdSchema = exports.createJournalSchema = void 0;
const zod_1 = require("zod");
// Journal detail schema (for nested creation)
const journalDetailSchema = zod_1.z.object({
    urutan: zod_1.z.number().int().min(1),
    akunId: zod_1.z.string().cuid('Akun ID tidak valid'),
    deskripsi: zod_1.z.string().optional(),
    debit: zod_1.z.number().min(0).default(0),
    kredit: zod_1.z.number().min(0).default(0),
    costCenterId: zod_1.z.string().cuid().optional(),
    profitCenterId: zod_1.z.string().cuid().optional(),
}).refine((data) => (data.debit > 0 && data.kredit === 0) || (data.kredit > 0 && data.debit === 0), { message: 'Detail harus memiliki debit ATAU kredit, tidak boleh keduanya' });
// Create manual journal entry schema
exports.createJournalSchema = zod_1.z.object({
    body: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid('Perusahaan ID tidak valid'),
        periodeId: zod_1.z.string().cuid('Periode ID tidak valid'),
        nomorJurnal: zod_1.z.string().min(1, 'Nomor jurnal wajib diisi').optional(), // Auto-generated if not provided
        tanggal: zod_1.z.string().datetime('Format tanggal tidak valid').or(zod_1.z.date()),
        deskripsi: zod_1.z.string().min(1, 'Deskripsi wajib diisi'),
        detail: zod_1.z.array(journalDetailSchema).min(2, 'Minimal 2 detail jurnal diperlukan (debit dan kredit)'),
    }).refine((data) => {
        const totalDebit = data.detail.reduce((sum, d) => sum + d.debit, 0);
        const totalKredit = data.detail.reduce((sum, d) => sum + d.kredit, 0);
        return Math.abs(totalDebit - totalKredit) < 0.01; // Allow small floating point differences
    }, { message: 'Total debit dan kredit harus balance (sama)' }),
});
// Get journal by ID schema
exports.getJournalByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Journal ID tidak valid'),
    }),
});
// List journals schema
exports.listJournalsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        perusahaanId: zod_1.z.string().cuid().optional(),
        periodeId: zod_1.z.string().cuid().optional(),
        search: zod_1.z.string().optional(),
        tanggalMulai: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        tanggalAkhir: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        isPosted: zod_1.z
            .string()
            .transform((val) => val === 'true')
            .optional(),
    }),
});
// Get general ledger schema
exports.getGeneralLedgerSchema = zod_1.z.object({
    query: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid('Perusahaan ID tidak valid'),
        periodeId: zod_1.z.string().cuid('Periode ID tidak valid'),
        akunId: zod_1.z.string().cuid().optional(),
        tanggalMulai: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        tanggalAkhir: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    }),
});
// Get trial balance schema
exports.getTrialBalanceSchema = zod_1.z.object({
    query: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid('Perusahaan ID tidak valid'),
        periodeId: zod_1.z.string().cuid('Periode ID tidak valid'),
        tanggal: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    }),
});
// Delete journal schema
exports.deleteJournalSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Journal ID tidak valid'),
    }),
});

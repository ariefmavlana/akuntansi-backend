import { z } from 'zod';

// Journal detail schema (for nested creation)
const journalDetailSchema = z.object({
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

// Create manual journal entry schema
export const createJournalSchema = z.object({
    body: z.object({
        perusahaanId: z.string().cuid('Perusahaan ID tidak valid'),
        periodeId: z.string().cuid('Periode ID tidak valid'),
        nomorJurnal: z.string().min(1, 'Nomor jurnal wajib diisi').optional(), // Auto-generated if not provided
        tanggal: z.string().datetime('Format tanggal tidak valid').or(z.date()),
        deskripsi: z.string().min(1, 'Deskripsi wajib diisi'),
        detail: z.array(journalDetailSchema).min(2, 'Minimal 2 detail jurnal diperlukan (debit dan kredit)'),
    }).refine(
        (data) => {
            const totalDebit = data.detail.reduce((sum, d) => sum + d.debit, 0);
            const totalKredit = data.detail.reduce((sum, d) => sum + d.kredit, 0);
            return Math.abs(totalDebit - totalKredit) < 0.01; // Allow small floating point differences
        },
        { message: 'Total debit dan kredit harus balance (sama)' }
    ),
});

// Get journal by ID schema
export const getJournalByIdSchema = z.object({
    params: z.object({
        id: z.string().cuid('Journal ID tidak valid'),
    }),
});

// List journals schema
export const listJournalsSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        perusahaanId: z.string().cuid().optional(),
        periodeId: z.string().cuid().optional(),
        search: z.string().optional(),
        tanggalMulai: z.string().datetime().or(z.date()).optional(),
        tanggalAkhir: z.string().datetime().or(z.date()).optional(),
        isPosted: z
            .string()
            .transform((val) => val === 'true')
            .optional(),
    }),
});

// Get general ledger schema
export const getGeneralLedgerSchema = z.object({
    query: z.object({
        perusahaanId: z.string().cuid('Perusahaan ID tidak valid'),
        periodeId: z.string().cuid('Periode ID tidak valid'),
        akunId: z.string().cuid().optional(),
        tanggalMulai: z.string().datetime().or(z.date()).optional(),
        tanggalAkhir: z.string().datetime().or(z.date()).optional(),
    }),
});

// Get trial balance schema
export const getTrialBalanceSchema = z.object({
    query: z.object({
        perusahaanId: z.string().cuid('Perusahaan ID tidak valid'),
        periodeId: z.string().cuid('Periode ID tidak valid'),
        tanggal: z.string().datetime().or(z.date()).optional(),
    }),
});

// Delete journal schema
export const deleteJournalSchema = z.object({
    params: z.object({
        id: z.string().cuid('Journal ID tidak valid'),
    }),
});

// TypeScript types
export type CreateJournalInput = z.infer<typeof createJournalSchema>['body'];
export type GetJournalByIdInput = z.infer<typeof getJournalByIdSchema>['params'];
export type ListJournalsInput = z.infer<typeof listJournalsSchema>['query'];
export type GetGeneralLedgerInput = z.infer<typeof getGeneralLedgerSchema>['query'];
export type GetTrialBalanceInput = z.infer<typeof getTrialBalanceSchema>['query'];
export type DeleteJournalInput = z.infer<typeof deleteJournalSchema>['params'];
export type JournalDetailInput = z.infer<typeof journalDetailSchema>;

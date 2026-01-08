import { z } from 'zod';

export const UploadDocumentSchema = z.object({
    body: z.object({
        kategori: z.enum([
            'INVOICE',
            'RECEIPT',
            'CONTRACT',
            'PURCHASE_ORDER',
            'DELIVERY_NOTE',
            'TAX_DOCUMENT',
            'ASSET_IMAGE',
            'EMPLOYEE_DOCUMENT',
            'LAINNYA',
        ]),
        transaksiId: z.string().optional(),
        voucherId: z.string().optional(),
        asetTetapId: z.string().optional(),
        deskripsi: z.string().max(255).optional(),
        tags: z.string().optional(), // Comma separated tags
        isPublik: z.string().transform((val) => val === 'true').optional(),
    }),
});

export type UploadDocumentInput = z.infer<typeof UploadDocumentSchema>['body'];

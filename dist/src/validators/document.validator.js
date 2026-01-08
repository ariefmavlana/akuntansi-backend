"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadDocumentSchema = void 0;
const zod_1 = require("zod");
exports.UploadDocumentSchema = zod_1.z.object({
    body: zod_1.z.object({
        kategori: zod_1.z.enum([
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
        transaksiId: zod_1.z.string().optional(),
        voucherId: zod_1.z.string().optional(),
        asetTetapId: zod_1.z.string().optional(),
        deskripsi: zod_1.z.string().max(255).optional(),
        tags: zod_1.z.string().optional(), // Comma separated tags
        isPublik: zod_1.z.string().transform((val) => val === 'true').optional(),
    }),
});

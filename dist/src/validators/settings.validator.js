"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetSettingsSchema = exports.bulkUpdateSettingsSchema = exports.updateSettingSchema = exports.getSettingsSchema = void 0;
const zod_1 = require("zod");
// Get settings
exports.getSettingsSchema = zod_1.z.object({
    query: zod_1.z.object({
        kategori: zod_1.z.string().optional(),
        isPublik: zod_1.z.enum(['true', 'false']).optional(),
    }),
});
// Update single setting
exports.updateSettingSchema = zod_1.z.object({
    params: zod_1.z.object({
        key: zod_1.z.string(),
    }),
    body: zod_1.z.object({
        nilai: zod_1.z.string(),
    }),
});
// Bulk update settings
exports.bulkUpdateSettingsSchema = zod_1.z.object({
    body: zod_1.z.object({
        settings: zod_1.z.array(zod_1.z.object({
            kunci: zod_1.z.string(),
            nilai: zod_1.z.string(),
        })).min(1).max(50),
    }),
});
// Reset settings
exports.resetSettingsSchema = zod_1.z.object({
    query: zod_1.z.object({
        kategori: zod_1.z.string().optional(),
    }),
});

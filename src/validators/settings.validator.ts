import { z } from 'zod';

// Get settings
export const getSettingsSchema = z.object({
    query: z.object({
        kategori: z.string().optional(),
        isPublik: z.enum(['true', 'false']).optional(),
    }),
});

// Update single setting
export const updateSettingSchema = z.object({
    params: z.object({
        key: z.string(),
    }),
    body: z.object({
        nilai: z.string(),
    }),
});

// Bulk update settings
export const bulkUpdateSettingsSchema = z.object({
    body: z.object({
        settings: z.array(
            z.object({
                kunci: z.string(),
                nilai: z.string(),
            })
        ).min(1).max(50),
    }),
});

// Reset settings
export const resetSettingsSchema = z.object({
    query: z.object({
        kategori: z.string().optional(),
    }),
});

// Type exports
export type GetSettingsInput = z.infer<typeof getSettingsSchema>['query'];
export type UpdateSettingInput = {
    key: string;
    nilai: string;
};
export type BulkUpdateSettingsInput = z.infer<typeof bulkUpdateSettingsSchema>['body'];
export type ResetSettingsInput = z.infer<typeof resetSettingsSchema>['query'];

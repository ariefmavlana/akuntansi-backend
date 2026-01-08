import prisma from '@/config/database';
import logger from '@/utils/logger';
import { ValidationError } from './auth.service';
import type {
    GetSettingsInput,
    UpdateSettingInput,
    BulkUpdateSettingsInput,
    ResetSettingsInput,
} from '@/validators/settings.validator';

export class SettingsService {
    // Cache for settings (simple in-memory cache)
    private settingsCache = new Map<string, any>();
    private cacheTimeout = 5 * 60 * 1000; // 5 minutes

    // Get all settings with optional filtering
    async getSettings(filters: GetSettingsInput) {
        const where: any = {};

        if (filters.kategori) where.kategori = filters.kategori;
        if (filters.isPublik) where.isPublik = filters.isPublik === 'true';

        const settings = await prisma.sistemSetting.findMany({
            where,
            orderBy: [{ kategori: 'asc' }, { kunci: 'asc' }],
        });

        // Group by category for better organization
        const grouped = settings.reduce((acc, setting) => {
            if (!acc[setting.kategori]) {
                acc[setting.kategori] = [];
            }
            acc[setting.kategori].push({
                kunci: setting.kunci,
                nilai: this.parseValue(setting.nilai, setting.tipeData),
                tipeData: setting.tipeData,
                deskripsi: setting.deskripsi,
                isPublik: setting.isPublik,
                isSensitive: setting.isSensitive,
            });
            return acc;
        }, {} as Record<string, any[]>);

        return {
            data: grouped,
            total: settings.length,
        };
    }

    // Get single setting value
    async getSetting(key: string) {
        // Check cache first
        const cacheKey = `setting:${key}`;
        const cached = this.settingsCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.value;
        }

        const setting = await prisma.sistemSetting.findFirst({
            where: { kunci: key },
        });

        if (!setting) {
            throw new ValidationError(`Setting '${key}' tidak ditemukan`);
        }

        const value = this.parseValue(setting.nilai, setting.tipeData);

        // Update cache
        this.settingsCache.set(cacheKey, { value, timestamp: Date.now() });

        return value;
    }

    // Update single setting
    async updateSetting(data: UpdateSettingInput, userId: string) {
        const existing = await prisma.sistemSetting.findFirst({
            where: { kunci: data.key },
        });

        if (!existing) {
            throw new ValidationError(`Setting '${data.key}' tidak ditemukan`);
        }

        // Validate value based on type
        this.validateValue(data.nilai, existing.tipeData, existing.validasiRule);

        const updated = await prisma.sistemSetting.updateMany({
            where: { kunci: data.key },
            data: { nilai: data.nilai },
        });

        // Clear cache
        this.settingsCache.delete(`setting:${data.key}`);

        logger.info(`Setting '${data.key}' updated by user ${userId}`);

        return {
            kunci: data.key,
            nilai: this.parseValue(data.nilai, existing.tipeData),
        };
    }

    // Bulk update settings
    async bulkUpdateSettings(data: BulkUpdateSettingsInput, userId: string) {
        const results: any[] = [];

        await prisma.$transaction(async (tx) => {
            for (const setting of data.settings) {
                const existing = await tx.sistemSetting.findFirst({
                    where: { kunci: setting.kunci },
                });

                if (!existing) {
                    throw new ValidationError(`Setting '${setting.kunci}' tidak ditemukan`);
                }

                this.validateValue(setting.nilai, existing.tipeData, existing.validasiRule);

                await tx.sistemSetting.updateMany({
                    where: { kunci: setting.kunci },
                    data: { nilai: setting.nilai },
                });

                // Clear cache
                this.settingsCache.delete(`setting:${setting.kunci}`);

                results.push({
                    kunci: setting.kunci,
                    nilai: this.parseValue(setting.nilai, existing.tipeData),
                });
            }
        });

        logger.info(`Bulk updated ${results.length} settings by user ${userId}`);

        return { data: results, count: results.length };
    }

    // Reset settings to defaults
    async resetToDefaults(filters: ResetSettingsInput) {
        const where: any = {};
        if (filters.kategori) where.kategori = filters.kategori;

        const settings = await prisma.sistemSetting.findMany({ where });

        let resetCount = 0;

        await prisma.$transaction(async (tx) => {
            for (const setting of settings) {
                if (setting.defaultValue) {
                    await tx.sistemSetting.update({
                        where: { id: setting.id },
                        data: { nilai: setting.defaultValue },
                    });

                    // Clear cache
                    this.settingsCache.delete(`setting:${setting.kunci}`);
                    resetCount++;
                }
            }
        });

        logger.info(`Reset ${resetCount} settings to defaults`);

        return { message: `${resetCount} settings berhasil direset ke default`, count: resetCount };
    }

    // Helper: Parse value based on type
    private parseValue(value: string, tipeData: string): any {
        switch (tipeData) {
            case 'number':
                return Number(value);
            case 'boolean':
                return value === 'true' || value === '1';
            case 'json':
                try {
                    return JSON.parse(value);
                } catch {
                    return value;
                }
            default:
                return value;
        }
    }

    // Helper: Validate value
    private validateValue(value: string, tipeData: string, validasiRule?: string | null) {
        switch (tipeData) {
            case 'number':
                if (isNaN(Number(value))) {
                    throw new ValidationError('Nilai harus berupa angka');
                }
                break;
            case 'boolean':
                if (!['true', 'false', '0', '1'].includes(value.toLowerCase())) {
                    throw new ValidationError('Nilai harus berupa true/false');
                }
                break;
            case 'json':
                try {
                    JSON.parse(value);
                } catch {
                    throw new ValidationError('Nilai harus berupa JSON yang valid');
                }
                break;
        }

        // Additional validation rules (e.g., regex, range)
        if (validasiRule) {
            // TODO: Implement custom validation rules
        }
    }
}

export const settingsService = new SettingsService();

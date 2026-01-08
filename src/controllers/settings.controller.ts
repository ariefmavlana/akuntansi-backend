import { Request, Response, NextFunction } from 'express';
import { settingsService } from '@/services/settings.service';
import type {
    GetSettingsInput,
    UpdateSettingInput,
    BulkUpdateSettingsInput,
    ResetSettingsInput,
} from '@/validators/settings.validator';

export class SettingsController {
    // Get all settings
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = req.query as unknown as GetSettingsInput;
            const result = await settingsService.getSettings(filters);

            return res.json({
                success: true,
                data: result.data,
                total: result.total,
            });
        } catch (error) {
            next(error);
        }
    }

    // Update single setting
    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { key } = req.params;
            const { nilai } = req.body;
            const userId = (req as any).user.id;

            const result = await settingsService.updateSetting({ key, nilai }, userId);

            return res.json({
                success: true,
                message: 'Setting berhasil diupdate',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    // Bulk update settings
    async bulkUpdate(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body as BulkUpdateSettingsInput;
            const userId = (req as any).user.id;

            const result = await settingsService.bulkUpdateSettings(data, userId);

            return res.json({
                success: true,
                message: `Berhasil mengupdate ${result.count} settings`,
                data: result.data,
            });
        } catch (error) {
            next(error);
        }
    }

    // Reset to defaults
    async reset(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = req.query as unknown as ResetSettingsInput;
            const result = await settingsService.resetToDefaults(filters);

            return res.json({
                success: true,
                message: result.message,
                count: result.count,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const settingsController = new SettingsController();

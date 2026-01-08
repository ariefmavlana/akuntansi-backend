"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsController = exports.SettingsController = void 0;
const settings_service_1 = require("../services/settings.service");
class SettingsController {
    // Get all settings
    async getAll(req, res, next) {
        try {
            const filters = req.query;
            const result = await settings_service_1.settingsService.getSettings(filters);
            return res.json({
                success: true,
                data: result.data,
                total: result.total,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Update single setting
    async update(req, res, next) {
        try {
            const { key } = req.params;
            const { nilai } = req.body;
            const userId = req.user.id;
            const result = await settings_service_1.settingsService.updateSetting({ key, nilai }, userId);
            return res.json({
                success: true,
                message: 'Setting berhasil diupdate',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Bulk update settings
    async bulkUpdate(req, res, next) {
        try {
            const data = req.body;
            const userId = req.user.id;
            const result = await settings_service_1.settingsService.bulkUpdateSettings(data, userId);
            return res.json({
                success: true,
                message: `Berhasil mengupdate ${result.count} settings`,
                data: result.data,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Reset to defaults
    async reset(req, res, next) {
        try {
            const filters = req.query;
            const result = await settings_service_1.settingsService.resetToDefaults(filters);
            return res.json({
                success: true,
                message: result.message,
                count: result.count,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SettingsController = SettingsController;
exports.settingsController = new SettingsController();

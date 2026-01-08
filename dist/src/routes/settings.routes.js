"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("../controllers/settings.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const settings_validator_1 = require("../validators/settings.validator");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Get all settings (with optional filtering)
router.get('/', (0, validation_middleware_1.validate)(settings_validator_1.getSettingsSchema), settings_controller_1.settingsController.getAll.bind(settings_controller_1.settingsController));
// Update single setting
router.put('/:key', (0, validation_middleware_1.validate)(settings_validator_1.updateSettingSchema), settings_controller_1.settingsController.update.bind(settings_controller_1.settingsController));
// Bulk update settings
router.patch('/bulk', (0, validation_middleware_1.validate)(settings_validator_1.bulkUpdateSettingsSchema), settings_controller_1.settingsController.bulkUpdate.bind(settings_controller_1.settingsController));
// Reset settings to defaults
router.post('/reset', (0, validation_middleware_1.validate)(settings_validator_1.resetSettingsSchema), settings_controller_1.settingsController.reset.bind(settings_controller_1.settingsController));
exports.default = router;

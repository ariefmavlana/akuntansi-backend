import { Router } from 'express';
import { settingsController } from '@/controllers/settings.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validation.middleware';
import {
    getSettingsSchema,
    updateSettingSchema,
    bulkUpdateSettingsSchema,
    resetSettingsSchema,
} from '@/validators/settings.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all settings (with optional filtering)
router.get(
    '/',
    validate(getSettingsSchema),
    settingsController.getAll.bind(settingsController)
);

// Update single setting
router.put(
    '/:key',
    validate(updateSettingSchema),
    settingsController.update.bind(settingsController)
);

// Bulk update settings
router.patch(
    '/bulk',
    validate(bulkUpdateSettingsSchema),
    settingsController.bulkUpdate.bind(settingsController)
);

// Reset settings to defaults
router.post(
    '/reset',
    validate(resetSettingsSchema),
    settingsController.reset.bind(settingsController)
);

export default router;

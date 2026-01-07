import { Router } from 'express';
import { fixedAssetController } from '@/controllers/fixedAsset.controller';
import { validate } from '@/middleware/validation.middleware';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import {
    createFixedAssetSchema,
    calculateDepreciationSchema,
    disposeAssetSchema,
    listFixedAssetsSchema,
} from '@/validators/fixedAsset.validator';
import { Role } from '@prisma/client';

const router = Router();
router.use(authenticate);

router.post(
    '/',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.SENIOR_ACCOUNTANT),
    validate(createFixedAssetSchema),
    fixedAssetController.createFixedAsset.bind(fixedAssetController)
);

router.post(
    '/:id/depreciation',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT, Role.SENIOR_ACCOUNTANT),
    validate(calculateDepreciationSchema),
    fixedAssetController.calculateDepreciation.bind(fixedAssetController)
);

router.post(
    '/:id/dispose',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.SENIOR_ACCOUNTANT),
    validate(disposeAssetSchema),
    fixedAssetController.disposeAsset.bind(fixedAssetController)
);

router.get(
    '/',
    validate(listFixedAssetsSchema),
    fixedAssetController.listFixedAssets.bind(fixedAssetController)
);

router.get(
    '/:id',
    fixedAssetController.getFixedAssetById.bind(fixedAssetController)
);

export default router;

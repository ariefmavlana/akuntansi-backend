import { Router } from 'express';
import { inventoryController } from '@/controllers/inventory.controller';
import { validate } from '@/middleware/validation.middleware';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import {
    createInventorySchema,
    stockMovementSchema,
    listInventorySchema,
} from '@/validators/inventory.validator';
import { Role } from '@prisma/client';

const router = Router();
router.use(authenticate);

router.post(
    '/',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER, Role.PURCHASING),
    validate(createInventorySchema),
    inventoryController.createInventory.bind(inventoryController)
);

router.post(
    '/movement',
    authorize(Role.SUPERADMIN, Role.ADMIN, Role.WAREHOUSE_MANAGER),
    validate(stockMovementSchema),
    inventoryController.recordStockMovement.bind(inventoryController)
);

router.get(
    '/',
    validate(listInventorySchema),
    inventoryController.listInventory.bind(inventoryController)
);

router.get(
    '/:id',
    inventoryController.getInventoryById.bind(inventoryController)
);

export default router;

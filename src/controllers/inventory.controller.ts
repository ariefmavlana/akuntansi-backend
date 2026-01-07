import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '@/services/inventory.service';
import { successResponse, createdResponse } from '@/utils/response';

export class InventoryController {
    async createInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const inventory = await inventoryService.createInventory(req.body, requestingUserId);
            createdResponse(res, inventory, 'Inventory berhasil dibuat');
        } catch (error) {
            next(error);
        }
    }

    async recordStockMovement(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const result = await inventoryService.recordStockMovement(req.body, requestingUserId);
            successResponse(res, result, 'Pergerakan stok berhasil dicatat');
        } catch (error) {
            next(error);
        }
    }

    async listInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const result = await inventoryService.listInventory(req.query as any, requestingUserId);
            successResponse(res, result.data, 'Data inventory berhasil diambil', 200, result.meta);
        } catch (error) {
            next(error);
        }
    }

    async getInventoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const inventory = await inventoryService.getInventoryById(req.params.id, requestingUserId);
            successResponse(res, inventory, 'Data inventory berhasil diambil');
        } catch (error) {
            next(error);
        }
    }
}

export const inventoryController = new InventoryController();

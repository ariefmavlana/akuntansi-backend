"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryController = exports.InventoryController = void 0;
const inventory_service_1 = require("../services/inventory.service");
const response_1 = require("../utils/response");
class InventoryController {
    async createInventory(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const inventory = await inventory_service_1.inventoryService.createInventory(req.body, requestingUserId);
            (0, response_1.createdResponse)(res, inventory, 'Inventory berhasil dibuat');
        }
        catch (error) {
            next(error);
        }
    }
    async recordStockMovement(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const result = await inventory_service_1.inventoryService.recordStockMovement(req.body, requestingUserId);
            (0, response_1.successResponse)(res, result, 'Pergerakan stok berhasil dicatat');
        }
        catch (error) {
            next(error);
        }
    }
    async listInventory(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const result = await inventory_service_1.inventoryService.listInventory(req.query, requestingUserId);
            (0, response_1.successResponse)(res, result.data, 'Data inventory berhasil diambil', 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    async getInventoryById(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const inventory = await inventory_service_1.inventoryService.getInventoryById(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, inventory, 'Data inventory berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.InventoryController = InventoryController;
exports.inventoryController = new InventoryController();

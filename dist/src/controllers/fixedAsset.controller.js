"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixedAssetController = exports.FixedAssetController = void 0;
const fixedAsset_service_1 = require("../services/fixedAsset.service");
const response_1 = require("../utils/response");
class FixedAssetController {
    async createFixedAsset(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const asset = await fixedAsset_service_1.fixedAssetService.createFixedAsset(req.body, requestingUserId);
            (0, response_1.createdResponse)(res, asset, 'Aset tetap berhasil dibuat');
        }
        catch (error) {
            next(error);
        }
    }
    async calculateDepreciation(req, res, next) {
        try {
            const tanggal = req.body.tanggalHitung ? new Date(req.body.tanggalHitung) : undefined;
            const result = await fixedAsset_service_1.fixedAssetService.calculateDepreciation(req.params.id, tanggal);
            (0, response_1.successResponse)(res, result, 'Penyusutan berhasil dihitung');
        }
        catch (error) {
            next(error);
        }
    }
    async disposeAsset(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const result = await fixedAsset_service_1.fixedAssetService.disposeAsset(req.params.id, req.body, requestingUserId);
            (0, response_1.successResponse)(res, result, 'Aset berhasil dilepas');
        }
        catch (error) {
            next(error);
        }
    }
    async listFixedAssets(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const result = await fixedAsset_service_1.fixedAssetService.listFixedAssets(req.query, requestingUserId);
            (0, response_1.successResponse)(res, result.data, 'Data aset tetap berhasil diambil', 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    async getFixedAssetById(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const asset = await fixedAsset_service_1.fixedAssetService.getFixedAssetById(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, asset, 'Data aset tetap berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.FixedAssetController = FixedAssetController;
exports.fixedAssetController = new FixedAssetController();

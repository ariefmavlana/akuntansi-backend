import { Request, Response, NextFunction } from 'express';
import { fixedAssetService } from '@/services/fixedAsset.service';
import { successResponse, createdResponse } from '@/utils/response';

export class FixedAssetController {
    async createFixedAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const asset = await fixedAssetService.createFixedAsset(req.body, requestingUserId);
            createdResponse(res, asset, 'Aset tetap berhasil dibuat');
        } catch (error) {
            next(error);
        }
    }

    async calculateDepreciation(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tanggal = req.body.tanggalHitung ? new Date(req.body.tanggalHitung) : undefined;
            const result = await fixedAssetService.calculateDepreciation(req.params.id, tanggal);
            successResponse(res, result, 'Penyusutan berhasil dihitung');
        } catch (error) {
            next(error);
        }
    }

    async disposeAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const result = await fixedAssetService.disposeAsset(req.params.id, req.body, requestingUserId);
            successResponse(res, result, 'Aset berhasil dilepas');
        } catch (error) {
            next(error);
        }
    }

    async listFixedAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const result = await fixedAssetService.listFixedAssets(req.query as any, requestingUserId);
            successResponse(res, result.data, 'Data aset tetap berhasil diambil', 200, result.meta);
        } catch (error) {
            next(error);
        }
    }

    async getFixedAssetById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const asset = await fixedAssetService.getFixedAssetById(req.params.id, requestingUserId);
            successResponse(res, asset, 'Data aset tetap berhasil diambil');
        } catch (error) {
            next(error);
        }
    }
}

export const fixedAssetController = new FixedAssetController();

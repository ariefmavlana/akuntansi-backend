import { Response } from 'express';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';
import { documentService } from '@/services/document.service';
import logger from '@/utils/logger';

export class DocumentController {
    // Upload Document
    static async uploadDocument(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ status: 'error', message: 'No file uploaded' });
            }

            // Multer puts fields in req.body. 
            // We pass req.body, req.file, and userId.
            const document = await documentService.uploadDocument(
                req.body,
                req.file,
                req.user!.userId
            );

            res.status(201).json({
                status: 'success',
                data: document
            });
        } catch (error: any) {
            logger.error('Upload error:', error);
            res.status(400).json({ status: 'error', message: error.message });
        }
    }

    // Get Documents (List)
    static async getDocuments(req: AuthenticatedRequest, res: Response) {
        try {
            const { transaksiId, voucherId, asetTetapId } = req.query;

            const docs = await documentService.getDocuments({
                transaksiId: transaksiId as string,
                voucherId: voucherId as string,
                asetTetapId: asetTetapId as string
            });

            res.json({
                status: 'success',
                data: docs
            });
        } catch (error: any) {
            res.status(400).json({ status: 'error', message: error.message });
        }
    }

    // Delete Document
    static async deleteDocument(req: AuthenticatedRequest, res: Response) {
        try {
            await documentService.deleteDocument(
                req.params.id,
                req.user!.userId
            );
            res.json({
                status: 'success',
                message: 'Document deleted successfully'
            });
        } catch (error: any) {
            res.status(400).json({ status: 'error', message: error.message });
        }
    }
}

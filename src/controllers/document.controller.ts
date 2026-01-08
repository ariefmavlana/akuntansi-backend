import { Request, Response, NextFunction } from 'express';
import { documentService } from '@/services/document.service';
import type {
    UploadDocumentInput,
    GetDocumentsInput,
    UpdateDocumentInput,
} from '@/validators/document.validator';

export class DocumentController {
    // Upload document
    async upload(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body as UploadDocumentInput;
            const file = req.file;
            const userId = (req as any).user.id;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: 'File tidak ditemukan',
                });
            }

            const document = await documentService.uploadDocument(data, file, userId);

            return res.status(201).json({
                success: true,
                message: 'Dokumen berhasil diupload',
                data: document,
            });
        } catch (error) {
            next(error);
        }
    }

    // Get all documents
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = req.query as unknown as GetDocumentsInput;
            const result = await documentService.getDocuments(filters);

            return res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    // Get single document
    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const document = await documentService.getDocument(id);

            return res.json({
                success: true,
                data: document,
            });
        } catch (error) {
            next(error);
        }
    }

    // Download document
    async download(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const userId = (req as any).user.id;

            const { document, filePath } = await documentService.getDocumentPath(id, userId);

            return res.download(filePath, document.nama, (err) => {
                if (err) {
                    next(err);
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Update document metadata
    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const data = req.body as UpdateDocumentInput;

            const document = await documentService.updateDocument(id, data);

            return res.json({
                success: true,
                message: 'Dokumen berhasil diupdate',
                data: document,
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete document
    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const result = await documentService.deleteDocument(id);

            return res.json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const documentController = new DocumentController();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentController = exports.DocumentController = void 0;
const document_service_1 = require("../services/document.service");
class DocumentController {
    // Upload document
    async upload(req, res, next) {
        try {
            const data = req.body;
            const file = req.file;
            const userId = req.user.id;
            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: 'File tidak ditemukan',
                });
            }
            const document = await document_service_1.documentService.uploadDocument(data, file, userId);
            return res.status(201).json({
                success: true,
                message: 'Dokumen berhasil diupload',
                data: document,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Get all documents
    async getAll(req, res, next) {
        try {
            const filters = req.query;
            const result = await document_service_1.documentService.getDocuments(filters);
            return res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Get single document
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const document = await document_service_1.documentService.getDocument(id);
            return res.json({
                success: true,
                data: document,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Download document
    async download(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { document, filePath } = await document_service_1.documentService.getDocumentPath(id, userId);
            return res.download(filePath, document.nama, (err) => {
                if (err) {
                    next(err);
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Update document metadata
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const data = req.body;
            const document = await document_service_1.documentService.updateDocument(id, data);
            return res.json({
                success: true,
                message: 'Dokumen berhasil diupdate',
                data: document,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Delete document
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            const result = await document_service_1.documentService.deleteDocument(id);
            return res.json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DocumentController = DocumentController;
exports.documentController = new DocumentController();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentController = void 0;
const document_service_1 = require("../services/document.service");
const logger_1 = __importDefault(require("../utils/logger"));
class DocumentController {
    // Upload Document
    static async uploadDocument(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ status: 'error', message: 'No file uploaded' });
            }
            // Multer puts fields in req.body. 
            // We pass req.body, req.file, and userId.
            const document = await document_service_1.documentService.uploadDocument(req.body, req.file, req.user.userId);
            res.status(201).json({
                status: 'success',
                data: document
            });
        }
        catch (error) {
            logger_1.default.error('Upload error:', error);
            res.status(400).json({ status: 'error', message: error.message });
        }
    }
    // Get Documents (List)
    static async getDocuments(req, res) {
        try {
            const { transaksiId, voucherId, asetTetapId } = req.query;
            const docs = await document_service_1.documentService.getDocuments({
                transaksiId: transaksiId,
                voucherId: voucherId,
                asetTetapId: asetTetapId
            });
            res.json({
                status: 'success',
                data: docs
            });
        }
        catch (error) {
            res.status(400).json({ status: 'error', message: error.message });
        }
    }
    // Delete Document
    static async deleteDocument(req, res) {
        try {
            await document_service_1.documentService.deleteDocument(req.params.id, req.user.userId);
            res.json({
                status: 'success',
                message: 'Document deleted successfully'
            });
        }
        catch (error) {
            res.status(400).json({ status: 'error', message: error.message });
        }
    }
}
exports.DocumentController = DocumentController;

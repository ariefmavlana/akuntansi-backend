"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const document_controller_1 = require("../controllers/document.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const document_validator_1 = require("../validators/document.validator");
const router = (0, express_1.Router)();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow common document types
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|csv/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Tipe file tidak diizinkan'));
        }
    },
});
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Upload document
router.post('/', upload.single('file'), (0, validation_middleware_1.validate)(document_validator_1.uploadDocumentSchema), document_controller_1.documentController.upload.bind(document_controller_1.documentController));
// Get all documents
router.get('/', (0, validation_middleware_1.validate)(document_validator_1.getDocumentsSchema), document_controller_1.documentController.getAll.bind(document_controller_1.documentController));
// Get single document
router.get('/:id', (0, validation_middleware_1.validate)(document_validator_1.getDocumentSchema), document_controller_1.documentController.getById.bind(document_controller_1.documentController));
// Download document
router.get('/:id/download', (0, validation_middleware_1.validate)(document_validator_1.getDocumentSchema), document_controller_1.documentController.download.bind(document_controller_1.documentController));
// Update document metadata
router.put('/:id', (0, validation_middleware_1.validate)(document_validator_1.updateDocumentSchema), document_controller_1.documentController.update.bind(document_controller_1.documentController));
// Delete document
router.delete('/:id', (0, validation_middleware_1.validate)(document_validator_1.deleteDocumentSchema), document_controller_1.documentController.delete.bind(document_controller_1.documentController));
exports.default = router;

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { documentController } from '@/controllers/document.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validation.middleware';
import {
    uploadDocumentSchema,
    getDocumentsSchema,
    getDocumentSchema,
    updateDocumentSchema,
    deleteDocumentSchema,
} from '@/validators/document.validator';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow common document types
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|csv/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Tipe file tidak diizinkan'));
        }
    },
});

// All routes require authentication
router.use(authenticate);

// Upload document
router.post(
    '/',
    upload.single('file'),
    validate(uploadDocumentSchema),
    documentController.upload.bind(documentController)
);

// Get all documents
router.get(
    '/',
    validate(getDocumentsSchema),
    documentController.getAll.bind(documentController)
);

// Get single document
router.get(
    '/:id',
    validate(getDocumentSchema),
    documentController.getById.bind(documentController)
);

// Download document
router.get(
    '/:id/download',
    validate(getDocumentSchema),
    documentController.download.bind(documentController)
);

// Update document metadata
router.put(
    '/:id',
    validate(updateDocumentSchema),
    documentController.update.bind(documentController)
);

// Delete document
router.delete(
    '/:id',
    validate(deleteDocumentSchema),
    documentController.delete.bind(documentController)
);

export default router;

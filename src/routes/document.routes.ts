import { Router } from 'express';
import { DocumentController } from '@/controllers/document.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { upload } from '@/middlewares/upload.middleware';
import { validate } from '@/middlewares/validation.middleware';
import { UploadDocumentSchema } from '@/validators/document.validator';

const router = Router();

// Upload
router.post(
    '/',
    authenticate,
    upload.single('file'),
    validate(UploadDocumentSchema),
    DocumentController.uploadDocument
);

// Get List
router.get('/', authenticate, DocumentController.getDocuments);

// Delete
router.delete('/:id', authenticate, DocumentController.deleteDocument);

export default router;

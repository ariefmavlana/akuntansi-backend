"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const document_controller_1 = require("../controllers/document.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const document_validator_1 = require("../validators/document.validator");
const router = (0, express_1.Router)();
// Upload
router.post('/', auth_middleware_1.authenticate, upload_middleware_1.upload.single('file'), (0, validation_middleware_1.validate)(document_validator_1.UploadDocumentSchema), document_controller_1.DocumentController.uploadDocument);
// Get List
router.get('/', auth_middleware_1.authenticate, document_controller_1.DocumentController.getDocuments);
// Delete
router.delete('/:id', auth_middleware_1.authenticate, document_controller_1.DocumentController.deleteDocument);
exports.default = router;

const express = require('express');
const router = express.Router();
const documentsController = require('../Controllers/DocumentsController');
const upload = require('../Middleware/UploadMiddleware')
const authenticate = require('../Middleware/AuthenticatoinMiddleware')

router.post("/upload", authenticate, upload.single('file'), documentsController.createDocument);

router.get("/:id", authenticate, documentsController.getDocumentById);

router.get("/actualdoc/:id", authenticate, documentsController.getActualDocumentById);

router.get("/size/:id", authenticate, documentsController.getTotalFileSizeForUser);

router.put("/:id", authenticate, documentsController.updateDocumentById);

router.delete("/delete/soft/:id",authenticate,  documentsController.softDeleteDocumentById);

router.delete("/delete/hard/:id", authenticate, documentsController.hardDeleteDocumentById);

router.get("/owned/:id", authenticate, documentsController.getOwnedDocumentsById);

router.get("/shared/:id", authenticate, documentsController.getSharedDocumentsById);

router.get("/deleted/:id", authenticate, documentsController.getDeletedDocumentsById);

router.get("/search/:id", authenticate, documentsController.filterDocsTrial);

module.exports = router;

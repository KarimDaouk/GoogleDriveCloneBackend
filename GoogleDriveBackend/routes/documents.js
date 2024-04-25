const express = require('express');
const router = express.Router();
const documentsController = require('../Controllers/DocumentsController');
const upload = require('../Middleware/UploadMiddleware')
const authenticate = require('../Middleware/AuthenticatoinMiddleware')

router.post("/upload", authenticate, upload.single('file'), documentsController.createDocument);

router.post("/owned/folder", authenticate, documentsController.createFolder);

//router.get("/folder", authenticate, documentController.getFileById);

router.get("/:id", authenticate, documentsController.getDocumentById);

router.get("/actualdoc/:id", authenticate, documentsController.getActualDocumentById);

router.get("/size/:id", authenticate, documentsController.getTotalFileSizeForUser);

router.put("/:id", authenticate, documentsController.updateDocumentById);

router.delete("/delete/soft/:id",authenticate,  documentsController.softDeleteDocumentById);

router.delete("/delete/hard/:id", authenticate, documentsController.hardDeleteDocumentById);

// todo: change it to remove the docs/folders with parentDir !== null
router.get("/owned/:id", authenticate, documentsController.getOwnedDocumentsById);

// todo: change it to remove the docs/folders with parentDir !== null
router.get("/shared/:id", authenticate, documentsController.getSharedDocumentsById);

router.get("/deleted/:id", authenticate, documentsController.getDeletedDocumentsById);

router.get("/search/:id", authenticate, documentsController.filterDocsTrial);

module.exports = router;

const express = require('express');
const router = express.Router();
const documentsController = require('../Controllers/DocumentsController');
const upload = require('../Middleware/UploadMiddleware')
const authenticate = require('../Middleware/AuthenticatoinMiddleware')
// todo: update size of folder
router.post("/upload", authenticate, upload.single('file'), documentsController.createDocument);

router.post("/owned/folder", authenticate, documentsController.createFolder);

// todo: get specific folder content
router.get("/folder/:id", authenticate, documentsController.getFolderContentById);

router.get("/:id", authenticate, documentsController.getDocumentById);

router.get("/actualdoc/:id", authenticate, documentsController.getActualDocumentById);

router.get("/size/:id", authenticate, documentsController.getTotalFileSizeForUser);

router.put("/:id", authenticate, documentsController.updateDocumentById);

router.delete("/delete/soft/:id",authenticate,  documentsController.softDeleteDocumentById);

router.delete("/delete/hard/:id", authenticate, documentsController.hardDeleteDocumentById);

router.get("/owned/:id", authenticate, documentsController.getOwnedDocumentsById);

router.get("/shared/:id", authenticate, documentsController.getSharedDocumentsById);

// todo: change the location of the file/folder

// todo: display only those with null parentDir
router.get("/deleted/:id", authenticate, documentsController.getDeletedDocumentsById);
//router.get("/deleted/folder/:id", authenticate, documentsController.getDeletedFolderContent)

// todo: change the filtered to display first level only
router.get("/search/:id", authenticate, documentsController.filterDocsTrial);

module.exports = router;

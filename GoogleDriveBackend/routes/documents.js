const express = require('express');
const router = express.Router();
const documentsController = require('../Controllers/DocumentsController');
const upload = require('../Middleware/UploadMiddleware')
const authenticate = require('../Middleware/AuthenticatoinMiddleware')
// todo: update size of folder

//Karim
router.post("/upload", authenticate, upload.single('file'), documentsController.createDocument);

router.post("/owned/folder", authenticate, documentsController.createFolder);

router.get("/folder/:id", authenticate, documentsController.getFolderContentById);

//Karim
router.get("/:id", authenticate, documentsController.getDocumentById);

router.get("/actualdoc/:id", authenticate, documentsController.getActualDocumentById);

router.get("/size/:id", authenticate, documentsController.getTotalFileSizeForUser);

router.put("/:id", authenticate, documentsController.updateDocumentById);

// Karim Partial
router.delete("/delete/soft/:id",authenticate,  documentsController.softDeleteDocumentById);
//Karim Partial
router.delete("/delete/hard/:id", authenticate, documentsController.hardDeleteDocumentById);

router.get("/owned/:id", authenticate, documentsController.getOwnedDocumentsById);

router.get("/shared/:id", authenticate, documentsController.getSharedDocumentsById);

router.put("/owned/move/:id", authenticate, documentsController.relocateDocumentById);

// todo: display only those with null parentDir
//Karim
router.get("/deleted/:id", authenticate, documentsController.getDeletedDocumentsById);
//router.get("/deleted/folder/:id", authenticate, documentsController.getDeletedFolderContent)

router.get("/search/:id", authenticate, documentsController.filterDocsTrial);

//Karim
router.get("/download/:id", authenticate, documentsController.downloadDocument);

router.get("/starred/:id", authenticate, documentsController.getStarredDocumentById);

module.exports = router;

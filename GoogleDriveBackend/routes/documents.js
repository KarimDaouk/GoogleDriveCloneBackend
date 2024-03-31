const express = require('express');
const router = express.Router();
const documentsController = require('../Controllers/DocumentsController');
const upload = require('../Middleware/UploadMiddleware')

router.post("/upload", upload.single('file'), documentsController.createDocument);

router.get("/:id", documentsController.getDocumentById);

router.put("/:id", documentsController.updateDocumentById);

router.delete("/:id", documentsController.deleteDocumentById);

router.get("/owned/:id", documentsController.getOwnedDocumentsById);

router.get("/shared/:id", documentsController.getSharedDocumentsById);

router.get("/deleted/:id", documentsController.getDeletedDocumentsById);

router.get("/search/:id", documentsController.filterDocumentsbyQuery);

module.exports = router;

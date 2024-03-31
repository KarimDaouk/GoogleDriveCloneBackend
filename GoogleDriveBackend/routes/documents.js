const express = require('express');
const router = express.Router();
const documentsController = require('../Controllers/DocumentsController');
const upload = require('../Middleware/UploadMiddleware')
const authenticate = require('../Middleware/AuthenticatoinMiddleware')

router.post("/upload", authenticate, upload.single('file'), documentsController.createDocument);


router.get("/:id", authenticate, documentsController.getDocumentById);


router.put("/:id", authenticate, documentsController.updateDocumentById);


router.delete("/:id",authenticate,  documentsController.deleteDocumentById);



module.exports = router;

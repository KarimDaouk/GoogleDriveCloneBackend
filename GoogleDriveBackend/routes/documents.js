const express = require('express');
const router = express.Router();
const documentsController = require('../Controllers/DocumentsController');
const upload = require('../Middleware/UploadMiddleware')

router.post("/upload", upload.single('file'), documentsController.createDocument);


router.get("/:id", documentsController.getDocumentById);


router.put("/:id", documentsController.updateDocumentById);


router.delete("/:id", documentsController.deleteDocumentById);



module.exports = router;

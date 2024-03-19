const Document = require("../Models/Schemas/Document");
const ApiResponse = require("../Models/APIResponse");

// Controller methods for managing documents
const createDocument = async (req, res) => {
  try {
    console.log(req.file)
    const { ownerId } = req.body;
    if (!ownerId) {
      return  res.status(200).json(new ApiResponse(400, "Owner ID required",{}));
    }

    // Check if there's an uploaded file
    if (!req.file) {
        return  res.status(200).json(new ApiResponse(400, "File uploads Required",{}));
    }

    // console.log(req.body.ownerId);
    // console.log(req.file.originalname);
    // console.log(req.file.title)
    // console.log(req.file.filePath);
    // console.log(req.file.fileSize)
    // Create a new document instance
    const newDocument = new Document({
      ownerId:req.body.ownerId,
      title: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      uploadDate: Date.now(),
      fileSize: req.file.size,
      sharedWith: []
    });

    // Save the new document to the database
    await newDocument.save();

    // Respond with success message
    const response = new ApiResponse(
      201,
      "Document created successfully",
      newDocument
    );
    res.status(201).json(response);
  } catch (error) {
    // Handle errors
    console.error("Error creating document:", error);
    const response = new ApiResponse(500, "Internal Server Error", {});
    res.status(200).json(response);
  }
};

const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      // Document not found
      const response = new ApiResponse(404, "Document not found", {});
      return res.status(404).json(response);
    }

    // Respond with the document
    const response = new ApiResponse(200, "Success", document);
    res.status(200).json(response);
  } catch (error) {
    // Handle errors
    console.error("Error fetching document:", error);
    const response = new ApiResponse(500, "Internal Server Error", {});
    res.status(500).json(response);
  }
};

const updateDocumentById = async (req, res) => {
  try {
    const { title, content } = req.body;

    // Find the document by ID and update its properties
    const updatedDocument = await Document.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
      },
      { new: true }
    );

    if (!updatedDocument) {
      // Document not found
      const response = new ApiResponse(404, "Document not found", {});
      return res.status(404).json(response);
    }

    // Respond with the updated document
    const response = new ApiResponse(
      200,
      "Document updated successfully",
      updatedDocument
    );
    res.status(200).json(response);
  } catch (error) {
    // Handle errors
    console.error("Error updating document:", error);
    const response = new ApiResponse(500, "Internal Server Error", {});
    res.status(500).json(response);
  }
};

const deleteDocumentById = async (req, res) => {
  try {
    // Find the document by ID and delete it
    const deletedDocument = await Document.findByIdAndDelete(req.params.id);

    if (!deletedDocument) {
      // Document not found
      const response = new ApiResponse(404, "Document not found", {});
      return res.status(404).json(response);
    }

    // Respond with success message
    const response = new ApiResponse(200, "Document deleted successfully", {});
    res.status(200).json(response);
  } catch (error) {
    // Handle errors
    console.error("Error deleting document:", error);
    const response = new ApiResponse(500, "Internal Server Error", {});
    res.status(500).json(response);
  }
};

// Export the controller methods
module.exports = {
  createDocument,
  getDocumentById,
  updateDocumentById,
  deleteDocumentById,
};

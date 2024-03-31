const Document = require("../Models/Schemas/Document");
const ApiResponse = require("../Models/ApiResponse");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

// Controller methods for managing documents
const createDocument = async (req, res) => {
  try {
    console.log(req.file);
    const { ownerId } = req.body;
    if (!ownerId) {
      return res
        .status(200)
        .json(new ApiResponse(400, "Owner ID required", {}));
    }

    // Check if there's an uploaded file
    if (!req.file) {
      return res
        .status(200)
        .json(new ApiResponse(400, "File uploads Required", {}));
    }

    const newDocument = new Document({
      ownerId: req.body.ownerId,
      title: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      uploadDate: Date.now(),
      fileSize: req.file.size,
      sharedWith: [],
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
    const documentId = req.params.id;

    // Find document by ID in the database
    const document = await Document.findById(documentId);

    // Check if document exists
    if (!document) {
      return res
        .status(200)
        .json(new ApiResponse(404, "Document not found", {}));
    }

    // Respond with the found document
    res.status(200).json(new ApiResponse(200, "Document found", document));
  } catch (error) {
    // Handle errors
    console.error("Error fetching document:", error);
    const response = new ApiResponse(500, "Internal Server Error", {});
    res.status(200).json(response);
  }
};

const deleteDocumentById = async (req, res) => {
  try {
    const documentId = req.params.id;

    // Find document by ID in the database and delete it
    const deletedDocument = await Document.findByIdAndDelete(documentId);

    // Check if document exists
    if (!deletedDocument) {
      return res
        .status(200)
        .json(new ApiResponse(404, "Document not found", {}));
    }

    // Respond with success message
    res
      .status(200)
      .json(new ApiResponse(200, "Document deleted successfully", {}));
  } catch (error) {
    // Handle errors
    console.error("Error deleting document:", error);
    const response = new ApiResponse(500, "Internal Server Error", {});
    res.status(200).json(response);
  }
};

const updateDocumentById = async (req, res) => {
  try {
    const documentId = req.params.id;
    const { ownerId, sharedWith } = req.body;

    // Check if sharedWith is provided and convert strings to ObjectId
    const sharedWithIds = sharedWith.map(
      (userId) => new mongoose.Types.ObjectId(userId)
    );

    // Find document by ID in the database
    const document = await Document.findById(documentId);

    // Check if document exists
    if (!document) {
      return res
        .status(404)
        .json(new ApiResponse(404, "Document not found", {}));
    }

    // Check if ownerId matches the owner of the document
    if (document.ownerId.toString() !== ownerId.toString()) {
      return res
        .status(403)
        .json(
          new ApiResponse(
            403,
            "You do not have permission to update this document",
            {}
          )
        );
    }

    // Update the sharedWith array with the converted ObjectId values
    document.sharedWith = sharedWithIds;

    // Save the updated document to the database
    await document.save();

    // Respond with success message
    res
      .status(200)
      .json(new ApiResponse(200, "Document updated successfully", document));
  } catch (error) {
    // Handle errors
    console.error("Error updating document:", error);
    const response = new ApiResponse(500, "Internal Server Error", {});
    res.status(200).json(response);
  }
};

// Export the controller methods
module.exports = {
  createDocument,
  getDocumentById,
  deleteDocumentById,
  updateDocumentById,
};

const Document = require("../Models/Schemas/Document");
const User = require("../Models/Schemas/User")
const ApiResponse = require("../Models/ApiResponse");
const mongoose = require("mongoose");
const fs = require('fs');
const path = require('path');
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
    const user = User.findById(ownerId);
    if(!user){
      return res
      .status(200)
      .json(new ApiResponse(400, "User not Found in Database!", {}));
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

const getActualDocumentById = async (req, res) => {
  try {
    const documentId = req.params.id;

    // Find document by ID in the database
    const document = await Document.findById(documentId);

    console.log("This is the document", document)

    // Check if the document exists
    if (!document) {
      return res.status(404).json(new ApiResponse(404, "Document not found", {}));
    }

    // Assuming 'filePath' is a field in your document schema that holds the path to the file
    const filePath = document.filePath;

    console.log("This is the file path", filePath)

    // Check if file exists and is accessible
    if (!fs.existsSync(filePath)) {
      return res.status(404).json(new ApiResponse(404, "File not found", {}));
    }

    // Determine the content type from the file extension
    const mimeType = getMimeType(filePath);

    // Set the correct headers to inform the browser about how to handle the file
    res.setHeader('Content-Type', mimeType);

    // Pipe the file stream to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json(new ApiResponse(500, "Internal Server Error", {}));
  }
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.pdf': return 'application/pdf';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    case '.gif': return 'image/gif';
    case '.html': return 'text/html';
    case '.txt': return 'text/plain';
    default: return 'application/octet-stream'; // Default, generally forces a download
  }
}


const softDeleteDocumentById = async (req, res) => {
  try {
    const documentId = req.params.id;

    // Check if the user owns the document or if the document is shared with the user
    const userId = req.user.userId;

    const document = await Document.findById(documentId);
    if (!document){
      return res
        .status(200)
        .json(new ApiResponse(404, "Document not found", {}));
    }

    if (document.ownerId.toString() !== userId && !document.sharedWith.includes(userId)) {
      return res.status(200).json(
        new ApiResponse(403, "Unauthorized: You do not have permission to delete this document", {})
      );
    }

    // Find document by ID in the database and update the deleted status and date of deletion
    const updatedDocument = await Document.findByIdAndUpdate(
      documentId,
      {
        deleted: true,
        dateOfDeletion: new Date()
      },
      { new: true }
    );

    // Check if document exists
    if (!updatedDocument) {
      const response = new ApiResponse(404, "Document not found", {});
      return res.status(200).json(response);
    }

    // Respond with success message
    const response = new ApiResponse(200, "Document deleted successfully", {});
    return res.status(200).json(response);
  } catch (error) {
    // Handle errors
    console.error("Error deleting document:", error);
    const response = new ApiResponse(500, "Internal Server Error", {});
    res.status(200).json(response);
  }
};

const hardDeleteDocumentById = async (req, res) => {
  try {
    const documentId = req.params.id;

    // Check if the user owns the document or if the document is shared with the user
    const userId = req.user.userId;

    const document = await Document.findById(documentId);
    if (!document){
      return res
        .status(200)
        .json(new ApiResponse(404, "Document not found", {}));
    }

    if (document.ownerId.toString() !== userId && !document.sharedWith.includes(userId)) {
      return res.status(200).json(
        new ApiResponse(403, "Unauthorized: You do not have permission to delete this document", {})
      );
    }
    
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
    res
      .status(200)
      .json(new ApiResponse(500, "Internal Server Error", {}));
  }
}

const updateDocumentById = async (req, res) => {
  try {
    const documentId = req.params.id;
    const { ownerId, sharedWith } = req.body;
    console.log("owner " + ownerId + " " + typeof sharedWith)

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

const getOwnedDocumentsById = async (req, res) => {
  try {
    const userId = req.params.id; 
    const userDocuments = await Document.find({ ownerId: userId });
    res
      .status(200)
      .json(new ApiResponse(200, "Documents retrieved successfully", userDocuments));
  } catch (error) {
    console.error("Error fetching user's documents:", error);
    const response = new ApiResponse(500, "Internal Server Error", {});
    res.status(200).json(response);
  }
}

const getSharedDocumentsById = async (req, res) => {

  try {
    const userId = req.params.id; 
    const sharedDocuments = await Document.find({ sharedWith: userId });
    res
      .status(200)
      .json(new ApiResponse(200, "Shared documents retrieved successfully", sharedDocuments));
  } catch (error) {
      console.error("Error fetching shared documents:", error);
      const response = new ApiResponse(500, "Internal Server Error", {});
      res
        .status(200)
        .json(response);
  }

}

const getDeletedDocumentsById = async (req, res) => {
  try {
    const userId = req.params.id; 
    const deletedDocuments = await Document.find({ ownerId: userId, deleted : true });
    res
      .status(200)
      .json(new ApiResponse(200, "Documents retrieved successfully", deletedDocuments));
  } catch (error) {
    console.error("Error fetching user's documents:", error);
    const response = new ApiResponse(500, "Internal Server Error", {});
    res.status(200).json(response);
  }
}

const filterDocumentsbyQuery = async (req, res) => {
  try {
    const userId = req.params.id; 
    const searchString = req.query.filter.toLowerCase(); 

    // Search for documents owned by the user
    const ownedDocuments = await Document.find({ ownerId: userId });

    // Search for documents shared with the user
    const sharedDocuments = await Document.find({ sharedWith: userId });

    // Filter owned documents containing the search query
    const filteredOwnedDocuments = ownedDocuments.filter(document =>
      document.title.toLowerCase().includes(searchString)
    );

    // Filter shared documents containing the search query
    const filteredSharedDocuments = sharedDocuments.filter(document =>
      document.title.toLowerCase().includes(searchString) 
    );

    const filteredDocuments = filteredOwnedDocuments.concat(filteredSharedDocuments);
    res
    .status(200)
    .json(new ApiResponse(200, "Documents retrieved successfully", filteredDocuments));

    } catch (error) {
    console.error("Error fetching user's documents:", error);
    const response = new ApiResponse(500, "Internal Server Error", {});
    res.status(200).json(response);
    }
};


// Route handler to get total file size for a specific user
const getTotalFileSizeForUser = async (req, res) => {
  try {
    const userId = req.params.id;  // Assuming userId is passed as a URL parameter
    console.log("This is the user ID ", userId)
    // Convert userId to an ObjectId, handling potential errors
   

    // Fetch all documents where the user is either the owner or is listed in sharedWith
    const documents = await Document.find({
      $or: [
        { ownerId: userId },
        { sharedWith: userId }
      ]
    });

    console.log("These are the documents for and shared with user",documents)

    // Sum up the file sizes and convert to MB
    const totalSizeBytes = documents.reduce((acc, document) => acc + document.fileSize, 0);
    const totalSizeMB = totalSizeBytes / 1048576;  // Convert bytes to MB

    // Respond with the total size in MB
    res.json({ totalSizeMB: totalSizeMB.toFixed(2) });
  } catch (error) {
    console.error("Error fetching documents for user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};





// Export the controller methods
module.exports = {
  createDocument,
  getDocumentById,
  softDeleteDocumentById,
  hardDeleteDocumentById,
  updateDocumentById,
  getOwnedDocumentsById,
  getSharedDocumentsById,
  getDeletedDocumentsById,
  filterDocumentsbyQuery,
  getActualDocumentById,
  getTotalFileSizeForUser
};

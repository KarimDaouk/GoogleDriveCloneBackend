const Document = require("../Models/Schemas/Document");
const User = require("../Models/Schemas/User")
const ApiResponse = require("../Models/ApiResponse");
const mongoose = require("mongoose");
const fs = require('fs');
const path = require('path');
const ObjectId = mongoose.Types.ObjectId;
const mammoth = require('mammoth');
const pdf = require('pdf-parse');
const xlsx = require('xlsx');

// Controller methods for managing documents
const createDocument = async (req, res) => {
  try {
    console.log(req.file);
    const { ownerId, parentFolderId } = req.body;
    if (!ownerId) {
      return res
        .status(200)
        .json(new ApiResponse(400, "Owner ID required", {}));
    }
    const user = await User.findById(ownerId);
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

    let folder;
    if (parentFolderId && parentFolderId !== "base") {
      // Check if parent folder exists
      folder = await Document.findById(parentFolderId);
      if (!folder) {
        return res.status(200).json(new ApiResponse(400, "Parent folder not found", {}));
      }
    }

    const newDocument = new Document({
      ownerId: req.body.ownerId,
      title: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      uploadDate: Date.now(),
      fileSize: req.file.size,
      sharedWith: [],
      type: req.file.mimetype,
      parentDir: mongoose.Types.ObjectId.isValid(parentFolderId) ? parentFolderId : null
    });


    console.log("this is the file were saving:", newDocument)

    // Save the new document to the database
    const savedDocument = await newDocument.save();


    if (folder) {
      folder.refDocs.push(savedDocument._id);
      folder.fileSize = folder.fileSize + savedDocument.fileSize;
      await folder.save();
    }
    
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
      return res.status(200).json(new ApiResponse(404, "Document not found", {}));
    }

    // Assuming 'filePath' is a field in your document schema that holds the path to the file
    const filePath = document.filePath;

    console.log("This is the file path", filePath)

    // Check if file exists and is accessible
    if (!fs.existsSync(filePath)) {
      return res.status(200).json(new ApiResponse(404, "File not found", {}));
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
    res.status(200).json(new ApiResponse(500, "Internal Server Error", {}));
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

    //If we dont own the document:
    if (document.ownerId.toString() !== userId && !document.sharedWith.includes(userId)) {
      return res.status(200).json(
        new ApiResponse(403, "Unauthorized: You do not have permission to delete this document", {})
      );
    }

    // Find document by ID in the database and update the deleted status and date of deletion:
    // IN CASE OF NORMAL DOCUMENT NOT FILE:

    const updatedDocument = await Document.findByIdAndUpdate(
      documentId,
      {
        deleted: true,
        dateOfDeletion: new Date()
      },
      { new: true }
    );
    const parentFileID = updatedDocument.parentDir;
    const fileSize = updatedDocument.fileSize;
    //update file size
    if (parentFileID){
        const parentFile = await Document.findById(parentFileID);
        if (parentFile){
          const parentFileSize = parentFile.fileSize;
          parentFile.fileSize = parentFileSize - fileSize;
          await parentFile.save();
        }
    }

    if (updatedDocument && updatedDocument.type === "file" && updatedDocument.refDocs) {
      const refDocsIds = updatedDocument.refDocs;
      const updateResult = await Document.updateMany(
        { _id: { $in: refDocsIds } },
        { $set: { deleted: true, dateOfDeletion: new Date() } }
      );
      if (!updatedDocument || !updateResult ) {
        const response = new ApiResponse(404, "Document not found", {});
        return res.status(200).json(response);
      }
      const parentId= updatedDocument.parentDir;
      const documentFileSize = updatedDocument.fileSize;

      if(parentId!=null){
      const updatedParentDoc = await Document.findByIdAndUpdate(
        parentId,
        { $pull: { sharedWith: updatedDocument.id } }, // Remove Doc ID from sharedWith array
        { new: true } // Returns the updated document
      );

      // remove folder's size
      if (updatedParentDoc) {
        const newFileSize = updatedParentDoc.fileSize - documentFileSize;
        updatedParentDoc.fileSize = newFileSize;
        await updatedParentDoc.save();
    }
    }
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
    if(deletedDocument.type!="file"){
    const filePath = path.join(__dirname,'..', 'Uploads', document.fileName);
      try {
          fs.unlinkSync(filePath);
          console.log(`File ${document.fileName} deleted successfully.`);
      } catch (err) {
          console.error(`Error deleting file ${document.fileName}:`, err);
      }
    }
    if(deletedDocument.type=="file"){
      const refDocsIds = deletedDocument.refDocs;
       const referencedDocuments = await Document.find({ _id: { $in: refDocsIds } });
       for (let doc of referencedDocuments) {
        await Document.findByIdAndDelete(doc._id); // Deleting the document from the database
        const filePath = path.join(__dirname,'..', 'Uploads', document.fileName);
        try {
            fs.unlinkSync(filePath);
            console.log(`File ${doc.fileName} deleted successfully.`);
        } catch (err) {
            console.error(`Error deleting file ${doc.fileName}:`, err);
        }
      }
    }

    if (deletedDocument){
      const docParentId = deletedDocument.parentDir;
      const documentId = deletedDocument._id;
      console.log("id " + documentId);
      if (docParentId){
        const oldFolder = await Document.findById(docParentId);
        if (!oldFolder || oldFolder.type !== 'folder'){
          return res.status(200).json(new ApiResponse(404, "Old Parent Folder not found", {}))
        }
        oldFolder.refDocs = oldFolder.refDocs.filter(refDocId => refDocId.toString() !== documentId.toString());
        await oldFolder.save();
      }
    }

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
    const { ownerId, sharedWith, starred, docName, description} = req.body;
    //console.log("owner " + ownerId + " " + typeof sharedWith + " " + starred)

    // Find document by ID in the database
    const document = await Document.findById(documentId);

    // Check if document exists
    if (!document) {
      return res
        .status(200)
        .json(new ApiResponse(404, "Document not found", {}));
    }

    // Check if ownerId matches the owner of the document
    if (document.ownerId.toString() !== ownerId.toString()) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            403,
            "You do not have permission to update this document",
            {}
          )
        );
    }

    // if sharedWith inclued
    if (sharedWith){
      const sharedWithIds = sharedWith.map(
        (userId) => new mongoose.Types.ObjectId(userId)
      );
      document.sharedWith = sharedWithIds;
    }

    // if starred included
    if (typeof starred !== 'undefined') {
      document.starred = (starred === true);
    }

    // if name  included
    if (docName){
      const documentName = document.title;
      const split = documentName.split('.');
      const extension = split[split.length-1];
      document.title = docName + (document.type === "folder" ? "" : ("." + extension));
    }

    // if description included
    if (description){
      document.description = description.toString();
    }
    // Save the updated document to the database
    await document.save();

    // update lastModifiedDate
    document.dateOfLastModified = new Date();
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
    const userDocuments = await Document.find({ ownerId: userId , deleted: false});
    const parentUserDocuments = userDocuments.filter(userDocument => userDocument.parentDir === null);
    res
      .status(200)
      .json(new ApiResponse(200, "Documents retrieved successfully", parentUserDocuments));
  } catch (error) {
    console.error("Error fetching user's documents:", error);
    const response = new ApiResponse(500, "Internal Server Error", {});
    res.status(200).json(response);
  }
}

const getSharedDocumentsById = async (req, res) => {

  try {
    const userId = req.params.id; 
    const sharedDocuments = await Document.find({ sharedWith: userId , deleted : false });
    const parentSharedDocuments = sharedDocuments.filter(sharedDocument => sharedDocument.parentDir === null);
    res
      .status(200)
      .json(new ApiResponse(200, "Shared documents retrieved successfully", parentSharedDocuments));
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

    // hard delete any documents that expired (past 30 days)
    const documentsToDelete = deletedDocuments.filter(deletedDocument => {
      const differenceInMilliseconds = Date.now() - deletedDocument.dateOfDeletion.getTime();
      const differenceInDays = differenceInMilliseconds / (1000 * 3600 * 24);
      return differenceInDays > 30;
    });
  
    for (const documentToDelete of documentsToDelete) {
      await Document.findByIdAndDelete(documentToDelete._id);
      const filePath = path.join(__dirname,'..', 'Uploads', documentToDelete.fileName);
      try {
          fs.unlinkSync(filePath);
          console.log(`File ${documentToDelete.fileName} deleted successfully.`);
      } catch (err) {
          console.error(`Error deleting file ${documentToDelete.fileName}:`, err);
      }
    }

    const newDeletedDocuments = await Document.find({ ownerId: userId, deleted : true , parentDir:null});
    
    res
      .status(200)
      .json(new ApiResponse(200, "Documents retrieved successfully", newDeletedDocuments));
  } catch (error) {
    console.error("Error fetching user's documents:", error);
    const response = new ApiResponse(500, "Internal Server Error", {});
    res.status(200).json(response);
  }
}

const filterDocsTrial = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.id); 

    // Type: Images, PDFs, Documents, Spreadsheets, Videos, zip, Folders
    const type = req.query.type ? req.query.type.toLowerCase() : '';
    console.log("type: " + type) // done
    const textSearchString = req.query.textSearchString ? req.query.textSearchString.toLowerCase() : '';
    console.log("tss: " + textSearchString) // done
    const itemName = req.query.itemName ? req.query.itemName.toLowerCase() : '';
    console.log("in: " + itemName) // done
    const location = req.query.location ? req.query.location.toLowerCase() : '';
    console.log("location: " + location) // done
    const deleted = req.query.deleted ? req.query.deleted : false;
    console.log("deleted: " + deleted) // done
    const starred = req.query.starred ? req.query.starred : false;
    console.log("starred: " + starred) // done
    const owner = req.query.owner ? req.query.owner.toLowerCase() : '';
    console.log("owner: " + owner) // done

    const pipeline = [];

    // Add match stage to filter documents by type
    if (type) {
      if (type !== 'any')
        pipeline.push({ $match: { type: type } });
    }

    // Add match stage to filter documents by search string
    if (itemName) {
      pipeline.push({ $match: { title: { $regex: itemName, $options: 'i' } } });
    }

    pipeline.push({ $match: { starred : starred==='true' ? true : false}});

    pipeline.push({ $match: { deleted : deleted==='true' ? true : false}});

    // Match owner: anyone, owned by me, specific email
    if (owner){
      if (owner === 'anyone') {
        // Find all documents owned by the user or shared with the user
        pipeline.push({
            $match: {
                $or: [
                    { ownerId: userId },
                    { sharedWith: userId }
                ]
            }
        });
      } else if (owner === 'owned by me') {
        if (location && location === "shared with me"){
          return res.status(200).json(new ApiResponse(200, "Documents retrieved successfully", {}));
        } 
        // Find documents owned only by the user
        pipeline.push({
            $match: { ownerId: userId }
        });
      } else if (owner === 'not owned by me') {
        if (location && location === 'my drive'){
          return res.status(200).json(new ApiResponse(200, "Documents retrieved successfully", {}));
        }
        pipeline.push({
          $match: { sharedWith: userId }
      });
      } else {
        if (location && location === 'my drive'){
          return res.status(200).json(new ApiResponse(200, "Documents retrieved successfully", {}));
        }
        // Find documents owned by the specified owner and shared with the user
        const ownerUser = await User.findOne({ email: owner });

        if (!ownerUser) {
          // Handle case where owner email is not found
          return res.status(200).json(new ApiResponse(404, "Owner not found", {}));
        }

        const ownerId = ownerUser._id;
        pipeline.push({
            $match: {
                ownerId: ownerId,
                sharedWith: userId
            }
        });
      }
    } else {
        pipeline.push({
          $match: {
              $or: [
                  { ownerId: userId },
                  { sharedWith: userId }
              ]
          }
      }); 
    }
    
    // Location: anywhere, my drive, shared with me, more locations: Validation
    if (location){
      if (location === 'anywhere') {
        pipeline.push({
          $match: {
              $or: [
                  { ownerId: userId },
                  { sharedWith: userId }
              ]
          }
      });
      } else if (location === 'my drive') {
        pipeline.push({
          $match: {ownerId: userId }
        });
      } else if (location === 'shared with me') {
        pipeline.push({
          $match: {sharedWith : userId}
        })
      } else if (location === 'starred'){
        pipeline.push({ $match: { starred : true}});
      } else if (location === 'binned'){
        pipeline.push({ $match: { deleted : true}});
      }
      else { // more locations
          const parentFolderId = location;
          pipeline.push({
            $match: {parentDir : new mongoose.Types.ObjectId(location)}
          })
      }
    }

    // Execute the aggregation pipeline
    var filteredDocuments = await Document.aggregate(pipeline);


    if (textSearchString) {
      // Use Promise.all() to asynchronously process each document
      filteredDocuments = await Promise.all(filteredDocuments.map(async (document) => {
          console.log("type " + document.type);
          // Await the result of checkTextInDocument function
          const found = await checkTextInDocument(
              path.join(__dirname, '..', 'Uploads', document.fileName),
              document.type,
              textSearchString
          );
          console.log("found " + found);
          return found ? document : null; // Return the document if text is found, otherwise null
      }));
  
      // Filter out null values (documents where text was not found)
      filteredDocuments = filteredDocuments.filter(doc => doc !== null);
  }
  

    console.log(filteredDocuments.length)
    // Respond with filtered documents
    res
    .status(200)
    .json(new ApiResponse(200, "Documents retrieved successfully", filteredDocuments));

    } catch (error) {
      console.error("Error fetching user's documents:", error);
      res.status(200).json(new ApiResponse(500, "Internal Server Error", {}));
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
    res.status(200).json(new ApiResponse(500, "Internal Server Error", {}));
  }
};


async function checkTextInDocument(filePath, documentType, text) {
  try {
      let textContent = '';

      if (documentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          // Word Document (.docx)
          const { value } = await mammoth.extractRawText({ path: filePath });
          textContent = value;
      } else if (documentType === 'text/plain') {
          // Plain Text (.txt)
          textContent = fs.readFileSync(filePath, 'utf8');
      } else if (documentType === 'application/pdf') {
          // PDF File (.pdf)
          const dataBuffer = fs.readFileSync(filePath);
          const data = await pdf(dataBuffer);
          console.log("DATA OF PDF:"+data.text )
          textContent = data.text;
      } else if (documentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
          // Excel Spreadsheet (.xlsx)
          const workbook = xlsx.readFile(filePath);
          const sheetName = workbook.SheetNames[0]; // read only from the first sheet
          const worksheet = workbook.Sheets[sheetName];
          textContent = xlsx.utils.sheet_to_csv(worksheet); // Change this to fit your requirements
      } else {
          return false;
      }

      console.log("worked" + " " + filePath)
      // Check if the text content includes the specified text
      return textContent.toLowerCase().includes(text.toLowerCase());
  } catch (error) {
      console.error('Error reading document:', error);
      throw error;
  }
}

const createFolder = async (req, res) => {
  try {
   
    const { ownerId, folderTitle, parentFolderId, description } = req.body;
    
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

    const folderName = Date.now()+"";
    const folderPath = "/"+ (mongoose.Types.ObjectId.isValid(parentFolderId) ? (parentFolderId+""):("base"))+"/"+folderName;

    const newFolder = new Document({
      ownerId: ownerId,
      title: folderTitle,
      fileName: folderName,
      filePath: folderPath,
      uploadDate: Date.now(),
      fileSize: 0,
      sharedWith: [],
      refDocs: [],
      type: "folder",
      parentDir : mongoose.Types.ObjectId.isValid(parentFolderId) ? parentFolderId : null
    });

    console.log("this is the folder were saving:", newFolder)

    // Save the new folder to the database
    const savedFolder = await newFolder.save();

    let folder;
    if (parentFolderId && parentFolderId !== "base") {
      // Check if parent folder exists
      folder = await Document.findById(parentFolderId);
      if (!folder) {
        return res.status(200).json(new ApiResponse(400, "Parent folder not found", {}));
      }
    }
    if (folder) {
      folder.refDocs.push(savedFolder._id);
      await folder.save();
    }

    // Respond with success message
    const response = new ApiResponse(
      201,
      "Folder created successfully",
      newFolder
    );
    res.status(201).json(response);
  } catch (error) {
    // Handle errors
    console.error("Error creating folder:", error);
    const response = new ApiResponse(500, "Internal Server Error", {});
    res.status(200).json(response);
  }
}

const getFolderContentById = async (req, res) => {

    try  {
      // get the folderId from id query
    const folderId = req.params.id;
    const folder = await Document.findById(folderId);
    console.log(folder)
    if (!folder){
      return res.status(200).json(new ApiResponse(404, "Folder not found", {}))
    }

    const folderRefs = folder.refDocs;
    var folderContent = [];
    for (let i = 0; i < folderRefs.length; i++) {
      const objectIdStr = folderRefs[i].toString();
      const doc = await Document.findById(objectIdStr);
      folderContent.push(doc);
    }

    const response = {
      folder: folder,
      content: folderContent
    }

    res.status(200).json(new ApiResponse(200, "Folder content retrieved successfully", response))
    } catch (error) {
      console.error("Error getting folder content " + error);
      res.status(200).json(new ApiResponse(500, "Internal Server Error", {}))
    }

}

const relocateDocumentById = async (req, res) => {
  
  try  {
    // get the the doc id from id query
  const documentId = req.params.id;
  const {newFolderId, ownerId } = req.body;
  console.log("document bodies " + newFolderId + " " + ownerId)
  const document = await Document.findById(documentId);
  if (!document){
    return res.status(200).json(new ApiResponse(404, "Document being relocated not found", {}))
  }

  // change old parent
  const oldParentId = document.parentDir;
  if (oldParentId) {
    const oldFolder = await Document.findById(oldParentId);
    if (!oldFolder || oldFolder.type !== 'folder'){
      return res.status(200).json(new ApiResponse(404, "Old Parent Folder not found", {}))
    }
    oldFolder.refDocs = oldFolder.refDocs.filter(refDocId => refDocId.toString() !== documentId);
    // update file size
    oldFolder.fileSize = oldFolder.fileSize - document.fileSize;
    await oldFolder.save();
  }

  // change new parent to base or new folder 
  if (newFolderId) {
    const newFolder = await Document.findById(newFolderId);
    if (!newFolder){
      return res.status(200).json(new ApiResponse(404, "New Parent Folder not found", {}))
    }
    newFolder.refDocs.push(documentId);
    document.parentDir = newFolderId;
    newFolder.fileSize = newFolder.fileSize + document.fileSize;
    await newFolder.save();
  } else {
    document.parentDir = null;
  }

  await document.save();
  res.status(200).json(new ApiResponse(200, "Document path updated successfully", {}))
  } catch (error) {
    console.error("Error updating document path: " + error);
    res.status(200).json(new ApiResponse(500, "Internal Server Error", {}))
  }

}

const downloadDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    console.log(documentId);
    
    // Fetch the document details from the database (e.g., MongoDB)
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json(new ApiResponse(404, "Document not found", {}));
    }

    // Construct the path to the document file in the uploads folder
    const filePath = path.join(__dirname, '..', 'Uploads', document.fileName);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json(new ApiResponse(404, "Uploaded document not found", {}));
    }

    // Set the appropriate headers for the file download
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.setHeader('Content-Type', document.type);

    // Send the file as a response
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json(new ApiResponse(500, "Internal Server Error", {}));
  }
};




const getStarredDocumentById = async (req, res) => {
  try {
    const userId = req.params.id; 

    const userOwnedDocuments = await Document.find({ ownerId: userId, starred: true , deleted: false});
    const parentUserDocuments = userOwnedDocuments.filter(userDocument => userDocument.parentDir === null);

    const sharedDocuments = await Document.find({ sharedWith: userId, starred: true , deleted: false});
    const parentSharedDocuments = sharedDocuments.filter(sharedDocument => sharedDocument.parentDir === null);

    const starredDocuments = [...parentUserDocuments, ...parentSharedDocuments];

    // Send response with the list of starred documents
    res.status(200).json(new ApiResponse(200, "Starred documents retrieved successfully", starredDocuments));
  } catch (error) {
    console.error("Error fetching starred documents:", error);
    const response = new ApiResponse(500, "Internal Server Error", {});
    res.status(200).json(response);
  }
}


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
  filterDocsTrial,
  getActualDocumentById,
  getTotalFileSizeForUser,
  createFolder,
  getFolderContentById,
  relocateDocumentById,
  downloadDocument,
  getStarredDocumentById,
 
};

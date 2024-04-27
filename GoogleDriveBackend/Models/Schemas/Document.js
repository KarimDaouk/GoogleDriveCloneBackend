const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true
    },

    fileName:{
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required:true
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    },
    fileSize: {
      type: Number,
      required: true
    },
    // New attributes for sharing
    sharedWith: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      default:[]
    }],
    deleted: {
      type: Boolean,
      default: false
    },
    dateOfDeletion: {
      type: Date
    },
    starred: {
      type: Boolean,
      default: false
    },
    dateOfLastModified: {
      type: Date,
      default: Date.now
    },
    refDocs : [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default:[]
    }],
    parentDir : {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'documents',
      default : null
    },
    description : {
      type: String,
      default: "N/A"
    }
  });
  
  module.exports = mongoose.model('Documents', DocumentSchema);
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
    description: String,
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
    }
  });
  
  module.exports = mongoose.model('Documents', DocumentSchema);
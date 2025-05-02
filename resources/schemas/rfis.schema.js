const mongoose = require("mongoose");

const rfiSchema = new mongoose.Schema(
  {
    _key: { type: String, required: true, index: true, unique: true },
    projectId: { type: String, required: true, index: true },
    accountId: String,
    customIdentifier: String,
    title: String,
    discipline: [String],
    priority: String,
    status: String,
    question: String,
    officialResponse: String,
    createdBy: String,
    assignedTo: String,
    managerId: String,
    respondedBy: String,
    respondedAt: Date,
    createdAt: Date,
    reviewerId: String,
    updatedBy: String,
    dueDate: Date,
    updatedAt: Date,
    closedAt: Date,
    closedBy: String,
  },
  {
    timestamps: false,
  }
);

// índice único sobre proyecto + identificador
rfiSchema.index({ projectId: 1, customIdentifier: 1 }, { unique: true });

module.exports = rfiSchema;

const mongoose = require("mongoose");

const issuesSchema = new mongoose.Schema(
  {
    _key: { type: String, required: true, index: true, unique: true },
    projectId: { type: String, required: true, index: true },
    accountId: String,
    id: { type: String, required: true, index: true },
    title: String,
    displayId: String,
    description: String,
    status: String,
    issueTypeName: String,
    createdAt: Date,
    createdBy: String,
    openedBy: String,
    assignedTo: String,
    closedBy: String,
    dueDate: Date,
    updatedAt: Date,
    updatedAtBy: String,
    closedAt: Date,
  },
  {
    timestamps: false,
  }
);

issuesSchema.index({ projectId: 1, displayId: 1 }, { unique: true });

module.exports = issuesSchema;

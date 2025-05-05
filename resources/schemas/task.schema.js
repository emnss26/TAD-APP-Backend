const mongoose = require("mongoose"); 

const taskSchema = new mongoose.Schema(
    {
        _key: { type: String, required: true, index: true, unique: true },
        projectId: { type: String, required: true, index: true },
        accountId: String,
        id: String,
        title: { type: String, required: true, index: true, trim: true },
        description: String,
        status: String,
        startDate: Date,
        endDate: Date,
        assignedTo: String,
        
    },
    {
        timestamps: false,
    })

taskSchema.index({ projectId: 1, id: 1 }, { unique: true });

module.exports = taskSchema;
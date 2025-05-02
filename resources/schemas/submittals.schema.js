const  mongoose = require ('mongoose');

const submittalsschema = new mongoose.Schema({
    _key: { type: String, required: true, index: true, unique: true },
    projectId: { type: String, required: true, index: true },
    accountId: String,
    identifier:String,
    id: String,
    title: String,
    description: String,
    state: String,
    priority: String,
    specIdentifier: String,
    specTitle: String,
    submittedBy: String,
    submitterByName: String,
    submitterDueDate: Date,
    managerName: String,
    updatedByName: String,
    publishedByName: String,
    publishedDate: Date,
    sentToReviewByName: String,
    createdAt: Date,
    createdByName: String,
    dueDate: Date,
    updatedAt: Date,
    updatedBy: String,
    
    }, {
        timestamps:false
})

submittalsschema.index({ projectId: 1, identifier: 1 }, { unique: true });

module.exports = submittalsschema;

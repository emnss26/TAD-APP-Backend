const mongoose = require('mongoose');

const projectUsersSchema = new mongoose.Schema({
    _key: { type: String, required: true, index: true, unique: true },
    projectId: { type: String, required: true, index: true },
    accountId: String,
    email: { type: String, required: true },
    name: String,
    firstName: String,
    lastName: String,
    status: String,
    companyName: String,
    roles: Array,
    accessLevel: Array,
    }, {
    timestamps: false,
    });

projectUsersSchema.index({ projectId: 1, email: 1 }, { unique: true });

module.exports = projectUsersSchema;
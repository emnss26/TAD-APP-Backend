const express = require("express");

// Data Management
const { GetFederatedModel } = require("./datamanagement.controller.js");
const { GetFoldersStructure } = require("./datamanagement.project.folders.controller.js");
const { GetFileData } = require("./datamanagement.items.controller.js");

const { GetFileRevisionStatus } = require("./datamanagement.files.reviews.controller.js");

const router = express.Router();

router.get("/items/:accountId/:projectId/federatedmodel", GetFederatedModel);
router.get("/folders/:accountId/:projectId/folder-structure", GetFoldersStructure);

router.post("/items/:accountId/:projectId/file-data", GetFileData);
router.post("/items/:accountId/:projectId/file-revisions", GetFileRevisionStatus);


module.exports = router;

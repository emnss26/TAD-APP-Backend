const express = require("express");

// Data Management
const { GetFederatedModel } = require("./federted_models/dm.federatedmodel.controller.js");
const { GetFoldersStructure } = require("../datamanagement/folder_permits/dm.project.folders.controller");
const { GetFileData } = require("../datamanagement/items_permits/dm.items.controller.js");

const { GetFolderPermits } = require("../datamanagement/folder_permits/dm.folder.permits.controller.js");
const { GetGLBFederatedModel } = require("./federted_models/dm.glb.vr.controller.js");
const { GetFileRevisionStatus } = require("../datamanagement/files_reviews/dm.files.reviews.controller.js");
const { GetIFCFederatedModel } = require("./federted_models/dm.ifc.federatedmodel.controller.js");

const router = express.Router();

// Models
router.get("/items/:accountId/:projectId/federatedmodel", GetFederatedModel);
router.get("/items/:accountId/:projectId/federated-ifc", GetIFCFederatedModel);
router.get("/items/:accountId/:projectId/federated-glb", GetGLBFederatedModel);

//Folders
router.get("/folders/:accountId/:projectId/folder-structure", GetFoldersStructure);
router.get("/folders/:accountId/:projectId/permissions", GetFolderPermits);

//Revisions and Files
router.post("/items/:accountId/:projectId/file-data", GetFileData);
router.post("/items/:accountId/:projectId/file-revisions", GetFileRevisionStatus);


module.exports = router;

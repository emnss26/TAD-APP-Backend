const express = require("express");

const {
  postDataModel,
  getDataModel,
  patchDataModel,
} = require("../model/model.controller.js");

const router = express.Router();

router.post("/:accountId/:projectId/data", postDataModel);
router.get("/:accountId/:projectId/data", getDataModel);
router.patch("/:accountId/:projectId/data/:dbId", patchDataModel);

module.exports = router;

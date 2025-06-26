const express = require("express");
const { body } = require("express-validator");

const {
  postDataModel,
  getDataModel,
  patchDataModel,
  deleteDataModel,
} = require("../model_checker/model.checker.controller");
const validate = require("../../libs/utils/validation.middleware");

const router = express.Router();

router.post(
  "/:accountId/:projectId/model-checker",
  [
    body("discipline").notEmpty().withMessage("Discipline is required"),
    body("row")
      .notEmpty()
      .withMessage("Row is required"),
    body("concept").notEmpty().withMessage("Concept is required"),
    body("req_lod")
      .notEmpty()
      .withMessage("Required Level of Detail is required"),
    body("complet_geometry")
      .notEmpty()
      .withMessage("Completed Geometry is required"),
    body("lod_compliance")
      .notEmpty()
      .withMessage("Level of Detail Compliance is required"),
    body("comments")
      .optional()
      .isString()
      .withMessage("Comments must be a string"),
    validate
  ],
  postDataModel
);

router.get("/:accountId/:projectId/model-checker/:discipline", getDataModel);

router.patch(
  "/:accountId/:projectId/model-checker/:discipline",
  [
    body("discipline").notEmpty().withMessage("Discipline is required"),
    body("row")
      .notEmpty()
      .withMessage("Row is required"),
    body("concept").notEmpty().withMessage("Concept is required"),
    body("req_lod")
      .notEmpty()
      .withMessage("Required Level of Detail is required"),
    body("complet_geometry")
      .notEmpty()
      .withMessage("Completed Geometry is required"),
    body("lod_compliance")
      .notEmpty()
      .withMessage("Level of Detail Compliance is required"),
    body("comments")
      .optional()
      .isString()
      .withMessage("Comments must be a string"),
      validate
  ],
  patchDataModel
);

router.delete(
  "/:accountId/:projectId/model-checker/:discipline",
  deleteDataModel
);

router.get("/:accountId/:projectId/model-checker", getDataModel);

module.exports = router;

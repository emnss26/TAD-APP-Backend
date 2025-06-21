const express = require('express');
const { body } = require('express-validator');

const {
  postDataModel,
  getDataModel,
  patchDataModel,
} = require('../model/model.controller.js');
const validate = require('../../libs/utils/validation.middleware');

const router = express.Router();

router.post(
  '/:accountId/:projectId/data',
  [
    body().custom(val => Array.isArray(val) || (val && typeof val === 'object'))
      .withMessage('Body must be an object or array')
      .customSanitizer(v => (Array.isArray(v) ? v : [v])),
    body('*.dbId').notEmpty().withMessage('dbId is required'),
    validate
  ],
  postDataModel
);
router.get('/:accountId/:projectId/data', getDataModel);
router.patch(
  '/:accountId/:projectId/data/:dbId',
  [
    body('field').notEmpty().withMessage('field is required'),
    body('value').exists().withMessage('value is required'),
    validate
  ],
  patchDataModel
);

module.exports = router;

const express = require('express');
const { body } = require('express-validator');

const { postDataModel, getDataModel, patchDataModel, deleteDataModel } = require('../plans/plans.controller.js');
const validate = require('../../libs/utils/validation.middleware');

const router = express.Router();

router.post(
  '/:accountId/:projectId/plans',
  [
    body().custom(val => Array.isArray(val) || (val && typeof val === 'object'))
      .withMessage('Body must be an object or array')
      .customSanitizer(v => (Array.isArray(v) ? v : [v])),
    body('*.Id').notEmpty().withMessage('Id is required'),
    body('*.SheetName').optional().isString(),
    body('*.SheetNumber').optional().isString(),
    body('*.Discipline').optional().isString(),
    body('*.Revision').optional().isString(),
    body('*.LastModifiedDate').optional().isString(),
    body('*.InFolder').optional().isBoolean(),
    body('*.InARevisionProcess').optional().isString(),
    body('*.RevisionStatus').optional().isString(),
    validate
  ],
  postDataModel
);
router.get('/:accountId/:projectId/plans', getDataModel);
router.patch(
  '/:accountId/:projectId/data/:Id',
  [
    body('field').notEmpty().withMessage('field is required'),
    body('value').exists().withMessage('value is required'),
    validate
  ],
  patchDataModel
);
router.delete(
  '/:accountId/:projectId/plans',
  [body('ids').isArray({ min: 1 }).withMessage('ids array required'), validate],
  deleteDataModel
);

module.exports = router;
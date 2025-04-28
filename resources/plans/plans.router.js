const  express = require("express");

const {postDataModel, getDataModel, patchDataModel } =require ("../plans/plans.controller.js")

const router = express.Router();

router.post('/:accountId/:projectId/plans', postDataModel)
router.get('/:accountId/:projectId/plans', getDataModel);
router.patch('/:accountId/:projectId/data/:Id', patchDataModel);

module.exports = router;
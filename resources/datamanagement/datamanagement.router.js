const  express = require('express');

// Data Management
const {GetFederatedModel} = require('./datamanagement.controller.js');

const  router = express.Router();

router.get('/items/:accountId/:projectId/federatedmodel', GetFederatedModel);

module.exports = router;
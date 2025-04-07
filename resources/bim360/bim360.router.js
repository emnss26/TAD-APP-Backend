const express = require('express');

//BIM360 Account Admin
const {GetProjects} = require('./account_admin/bim360.account.admin.controller.js');

const  router = express.Router();

router.get('/bim360projects', GetProjects);

module.exports = router;
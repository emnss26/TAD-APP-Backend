const express = require('express');

//BIM360 Account Admin
const {GetProjects} = require('./account_admin/bim360.account.admin.controller.js');
const {GetProjectUsers} = require('./account_admin/bim360.project.users.controller.js');
const {GetProject} = require('./account_admin/bim360.project.controller.js');
const {GetIssues} = require('./issues/bim360.controller.issues.js');
const {GetRfis} = require('./rfis/bim360.controller.rfis.js');

const  router = express.Router();

router.get('/bim360projects', GetProjects);
router.get('/bim360projects/:accountId/:projectId', GetProject);
router.get('/bim360projects/:accountId/:projectId/users', GetProjectUsers);
router.get('/bim360projects/:accountId/:projectId/issues', GetIssues);
router.get('/bim360projects/:accountId/:projectId/rfis', GetRfis);

module.exports = router;
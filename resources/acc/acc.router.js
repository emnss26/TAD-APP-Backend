const  express = require('express');

//ACC Account Admin
const {GetProjects} = require('./account_admin/acc.account.admin.controller.js');
const {GetProjectUsers} = require('./account_admin/acc.project.users.controller.js');
const {GetProject} = require('./account_admin/acc.project.controller.js');
const {GetIssues} = require('./issues/acc.controller.issues.js');
const {GetSubmittals} = require('./submittals/acc.controller.submittals.js');
const {GetRfis} = require('./rfis/acc.controller.rfis.js');

const  router = express.Router();

router.get ('/accprojects', GetProjects);
router.get ('/accprojects/:accountId/:projectId', GetProject);
router.get ('/accprojects/:accountId/:projectId/users', GetProjectUsers);
router.get ('/accprojects/:accountId/:projectId/issues', GetIssues);
router.get ('/accprojects/:accountId/:projectId/submittals', GetSubmittals);
router.get ('/accprojects/:accountId/:projectId/rfis', GetRfis);

module.exports = router;
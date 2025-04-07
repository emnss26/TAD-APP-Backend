const  express = require('express');

//ACC Account Admin
const {GetProjects} = require('./account_admin/acc.account.admin.controller.js');

const  router = express.Router();

router.get ('/accprojects', GetProjects);

module.exports = router;
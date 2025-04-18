const express = require ('express');
const router = express.Router ();

const {GetThreeLegged, PostLogout, GetToken} = require ('./auth.controller');

router.get ('/three-legged', GetThreeLegged);

router.get ('/token', GetToken);

router.post ('/logout', PostLogout);

module.exports = router;
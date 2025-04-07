const express = require ('express');
const router = express.Router ();

const {GetThreeLegged, PostLogout} = require ('./auth.controller');

router.get ('/three-legged', GetThreeLegged);

router.post ('/logout', PostLogout);

module.exports = router;
const express = require("express");

const { GetUserProfile } = require("./user.profile");

const router = express.Router();

router.get("/userprofile", GetUserProfile);

module.exports = router;

const express = require("express");
const router = express.Router();

const { GetThreeLegged, PostLogout, GetToken } = require("./auth.controller");
const { GetUserStatus } = require("./auth.user.status.controller");

router.get("/three-legged", GetThreeLegged);
router.get("/token", GetToken);
router.post("/logout", PostLogout);

router.get("/status", GetUserStatus);

module.exports = router;

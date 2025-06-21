const env = require('../../config/env.js');
const axios = require("axios");
const approvedemails = require("../../config/env.js");
const {
  GetAPSThreeLeggedToken,
  GetAPSToken,
} = require("../../libs/general/auth.libs");

const fronend_url =
  env.FRONTEND_URL || "http://localhost:5173";

  const GetThreeLegged = async (req, res) => {
    const { code } = req.query;
  
    try {
      const token = await GetAPSThreeLeggedToken(code);
      // const { data: userData } = await axios.get(
      //   `${env.AUTODESK_BASE_URL}/userprofile/v1/users/@me`,
      //   { headers: { Authorization: `Bearer ${token}` } }
      // );
      // const userEmail = userData.emailId;
  
      // if (
      //   !approvedemails.approvedemails.some(u => u.email === userEmail)
      // ) {
      //   return res.redirect(`${fronend_url}/not-authorized`);
      // }
  
   
      res.cookie("access_token", token, {
        maxAge: 3600000,
        httpOnly: true,
        secure: true,
        sameSite: "None",
        path: "/",
      });
  
      return res.redirect(`${fronend_url}/platform`);
  
    } catch (error) {
      console.error("Error en ThreeLegged:", error);
      return res.redirect(`${fronend_url}/not-authorized`);
    }
  };

const GetToken = async (req, res) => {
  try {
    const token = await GetAPSToken();
    res.status(200).json({
      data: {
        access_token: token,
      },
      error: null,
      message: "Token generated correctly",
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      error: null,
      message: "Token error",
    });
  }
};

const PostLogout = async (req, res) => {
  try {
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    });
    res.status(200).json({ message: "Logged out" });
  } catch (error) {
    res.status(500).json({
      message: "Error logging out",
      error: error.message,
    });
  }
};

module.exports = {
  GetThreeLegged,
  PostLogout,
  GetToken,
};

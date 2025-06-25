const env = require("../../config/index.js");
const axios = require("axios");

const {
  getAPSThreeLeggedToken,
} = require("../../libs/general/gen.auth.three.legged");
const {
  getAPSTwoLeggedToken,
} = require("../../libs/general/gen.auth.two.legged");

const frontend_url = env.FRONTEND_URL;

const GetThreeLegged = async (req, res) => {
  const { code } = req.query;

  try {
    const token = await getAPSThreeLeggedToken(code);

    res.cookie("access_token", token, {
      maxAge: 3600000,
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    });

    return res.redirect(`${frontend_url}/platform`);
  } catch (error) {
    console.error("Error en ThreeLegged:", error);
    return res.redirect(`${frontend_url}/not-authorized`);
  }
};

const GetToken = async (req, res) => {
  try {
    const token = await getAPSTwoLeggedToken();
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

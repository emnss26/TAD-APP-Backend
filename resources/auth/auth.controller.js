const axios = require("axios");
const approvedemails = require("../../const/approvedemails");
const {
  GetAPSThreeLeggedToken,
  GetAPSToken,
} = require("../../libs/general/auth.libs");

const fronend_url =
  process.env.FRONTEND_URL || "http://localhost:5173/platform";

const GetThreeLegged = async (req, res) => {
  const { code } = req.query;

  try {
    const token = await GetAPSThreeLeggedToken(code);

    const { data: userData } = await axios.get(
      "https://developer.api.autodesk.com/userprofile/v1/users/@me",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("User data:", userData);

    const userEmail = userData.emailId;
    console.log("User email:", userEmail);

    if (
      !approvedemails.approvedemails.some((user) => user.email === userEmail)
    ) {
      return res.status(403).json({
        message: "User is not authorized to access this app",
        error: "Unauthorized",
      });
    }

    res.cookie("access_token", token, {
      maxAge: 3600000,
      httpOnly: false,
      secure: true,
      sameSite: "none",
      path: "/",
      //domain: "tad-app-frontend.vercel.app"
    });

    console.log("token", token);
    res.redirect(`${fronend_url}/platform`);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching token",
      error: error.message,
    });
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
      httpOnly: false,
      secure: false,
      sameSite: "none",
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

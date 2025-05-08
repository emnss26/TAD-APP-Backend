const axios = require("axios");
const approvedemails = require("../../const/approvedemails");
const {
  GetAPSThreeLeggedToken,
  GetAPSToken,
} = require("../../libs/general/auth.libs");

const fronend_url =
  process.env.FRONTEND_URL || "http://localhost:5173";

  const GetThreeLegged = async (req, res) => {
    const { code } = req.query;
  
    try {
      const token = await GetAPSThreeLeggedToken(code);
      const { data: userData } = await axios.get(
        "https://developer.api.autodesk.com/userprofile/v1/users/@me",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const userEmail = userData.emailId;
  
      // Si el email NO está en la lista de aprobados, redirige:
      if (
        !approvedemails.approvedemails.some(u => u.email === userEmail)
      ) {
        // 302 redirect a la ruta de Not Allowed en tu front
        return res.redirect(`${fronend_url}/not-authorized`);
      }
  
      // Si todo ok, setea la cookie y avanza
      res.cookie("access_token", token, {
        maxAge: 3600000,
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        //domain: process.env.DOMAIN || "http://localhost:5173",
      });
  
      return res.redirect(`${fronend_url}/platform?token=${token}`);
  
    } catch (error) {
      console.error("Error en ThreeLegged:", error);
      // Opcional: redirige a un error genérico o a Not Allowed
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

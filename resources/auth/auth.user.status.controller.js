const axios = require("axios");

const fronend_url = process.env.FRONTEND_URL || "http://localhost:5173";

const GetUserStatus = async (req, res) => {
  const token = req.cookies["access_token"];

  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  try {
 
    const { data: userData } = await axios.get(
      "https://developer.api.autodesk.com/userprofile/v1/users/@me",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (userData?.userId) {
      return res.status(200).json({ authenticated: true });
    }

    return res.status(401).json({ authenticated: false });
  } catch (error) {
    console.error("🔐 Error validating Autodesk token:", error.message);
    return res.status(401).json({ authenticated: false });
  }
};

module.exports = {
  GetUserStatus,
};

const env = require('../../config/index.js');
const axios = require("axios");

const fronend_url = env.FRONTEND_URL || "http://localhost:5173";

const GetUserStatus = async (req, res) => {
  const token = req.cookies["access_token"];

  if (!token) {
    return res.status(401).json({ data: { authenticated: false }, error: null, message: 'Unauthorized' });
  }

  try {
 
    const { data: userData } = await axios.get(
      `${env.AUTODESK_BASE_URL}/userprofile/v1/users/@me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (userData?.userId) {
      return res.status(200).json({ data: { authenticated: true }, error: null, message: null });
    }

    return res.status(401).json({ data: { authenticated: false }, error: null, message: 'Unauthorized' });
  } catch (error) {
    console.error("🔐 Error validating Autodesk token:", error.message);
    return res.status(401).json({ data: { authenticated: false }, error: null, message: 'Invalid token' });
  }
};

module.exports = {
  GetUserStatus,
};

const axios = require("axios");

const validateAutodeskToken = async (req, res, next) => {
  const token = req.cookies.access_token;

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { data } = await axios.get(
      "https://developer.api.autodesk.com/userprofile/v1/users/@me",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    req.user = data;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = validateAutodeskToken;
const env = require("../../config/env.js");
const axios = require("axios");

const validateAutodeskToken = async (req, res, next) => {
  const token = req.cookies["access_token"];

  if (!token) {
    return res.status(401).json({ data: null, error: 'Unauthorized', message: 'Unauthorized' });
  }

  try {
    const { data } = await axios.get(
      `${env.AUTODESK_BASE_URL}/userprofile/v1/users/@me`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    req.user = data;
    next();
  } catch (err) {
    res.status(401).json({ data: null, error: 'Invalid token', message: 'Invalid token' });
  }
};

module.exports = validateAutodeskToken;
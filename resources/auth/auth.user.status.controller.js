const env = require('../../config/index.js');
const axios = require("axios");

const { approvedemails } = require('../../const/approvedemails')

const frontend_url = env.FRONTEND_URL;

const GetUserStatus = async (req, res) => {
  const token = req.cookies["access_token"];

  if (!token) {
    return res.status(401).json({ data: { authenticated: false }, error: null, message: 'Unauthorized' });
  }

  try {
    const { data: userData } = await axios.get(
      `${env.AUTODESK_BASE_URL}/userprofile/v1/users/@me`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log ('Email', userData.emailId)
    const email = userData.emailId?.toLowerCase();
    const isAuth = Boolean(email);
    const isAuthorized = isAuth && approvedemails
      .some(u => u.email.toLowerCase() === email);

    if (isAuth && !isAuthorized) {
      return res
        .status(403)
        .json({ data: { authenticated: true, authorized: false }, error: null, message: 'Forbidden' });
    }

    if (isAuth && isAuthorized) {
      return res
        .status(200)
        .json({ data: { authenticated: true, authorized: true }, error: null, message: null });
    }

    return res
      .status(401)
      .json({ data: { authenticated: false, authorized: false }, error: null, message: 'Unauthorized' });
  } catch (error) {
    console.error("🔐 Error validating Autodesk token:", error.message);
    return res.status(401).json({ data: { authenticated: false }, error: null, message: 'Invalid token' });
  }
};

module.exports = {
  GetUserStatus,
};

const env = require("../../config/index.js");
const axios = require("axios");

const APS_CLIENT_ID = env.APS_CLIENT_ID;
const APS_CLIENT_SECRET = env.APS_CLIENT_SECRET;
const redirect_uri = env.REDIRECT_URI;
const threeLeggedScopes = env.TOKEN_SCOPES.threeLegged;

const getAPSThreeLeggedToken = async (code) => {
    if (!APS_CLIENT_ID || !APS_CLIENT_SECRET) {
    throw new Error(
      "Missing APS_CLIENT_ID or APS_CLIENT_SECRET environment variables"
    );
  }

  const credentials = `${APS_CLIENT_ID}:${APS_CLIENT_SECRET}`;
  const encodedCredentials = Buffer.from(credentials).toString("base64");

  const requestdata = {
    grant_type: "authorization_code",
    code: code,
    redirect_uri: redirect_uri,
    scope: threeLeggedScopes,
  };

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
    Authorization: `Basic ${encodedCredentials}`,
  };

  try {
    const { data } = await axios.post(
      `${env.AUTODESK_BASE_URL}/authentication/v2/token`,
      new URLSearchParams(requestdata).toString(),
      { headers }
    );
    return data.access_token;
  } catch (error) {
    console.error("Error fetching token:", error.message);
    if (error.response) {
      console.error("Error response data:", error.response.data);
    }
    throw error;
  }
};

module.exports = {
  getAPSThreeLeggedToken,
};

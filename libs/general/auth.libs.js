const env = require("../../config/index.js");
const axios = require("axios");

const APS_CLIENT_ID = env.APS_CLIENT_ID;
const APS_CLIENT_SECRET = env.APS_CLIENT_SECRET;
const redirect_uri = env.REDIRECT_URI;
const threeLeggedScopes = env.TOKEN_SCOPES.threeLegged;
const twoLeggedScopes = env.TOKEN_SCOPES.twoLegged;

const GetAPSThreeLeggedToken = async (code) => {
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

const GetAPSToken = async () => {
  if (!APS_CLIENT_ID || !APS_CLIENT_SECRET) {
    throw new Error("No se han configurado las credenciales de Autodesk Forge");
  }

  const credentials = `${APS_CLIENT_ID}:${APS_CLIENT_SECRET}`;
  const encodedCredentials = Buffer.from(credentials).toString("base64");

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
    Authorization: `Basic ${encodedCredentials}`,
  };

  const requestdata = {
    grant_type: "client_credentials",
    scope: twoLeggedScopes,
  };

  const { data } = await axios.post(
    `${env.AUTODESK_BASE_URL}/authentication/v2/token`,
    new URLSearchParams(requestdata).toString(),
    { headers }
  );

  //console.log("Token:", data.access_token);

  return data.access_token;
};

module.exports = {
  GetAPSThreeLeggedToken,
  GetAPSToken,
};

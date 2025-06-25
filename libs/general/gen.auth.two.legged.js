const env = require("../../config/index.js");
const axios = require("axios");

const APS_CLIENT_ID = env.APS_CLIENT_ID;
const APS_CLIENT_SECRET = env.APS_CLIENT_SECRET;
const redirect_uri = env.REDIRECT_URI;
const twoLeggedScopes = env.TOKEN_SCOPES.twoLegged;

const getAPSTwoLeggedToken = async () => {
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
  getAPSTwoLeggedToken,
};

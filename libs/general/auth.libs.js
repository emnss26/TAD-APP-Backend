const  express = require ('express');
const axios = require ('axios');
const router = express.Router ();

const APS_CLIENT_ID = process.env.APS_CLIENT_ID;
const APS_CLIENT_SECRET = process.env.APS_CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI || "http://localhost:3000/auth/three-legged"

const GetAPSThreeLeggedToken = async (code) => {
    if (!APS_CLIENT_ID || !APS_CLIENT_SECRET) {
        throw new Error ('Missing APS_CLIENT_ID or APS_CLIENT_SECRET environment variables');
    }

    const credentials = `${APS_CLIENT_ID}:${APS_CLIENT_SECRET}`;
    const encodedCredentials = Buffer.from (credentials).toString ('base64');

    const requestdata = {
        'grant_type' : 'authorization_code',
        'code' : code,
        'redirect_uri' : redirect_uri,
        'scope': 'data:read data:write data:create account:read viewables:read'
    }

    const headers = {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Basic ${encodedCredentials}`
    }

    try {
        const { data } = await axios.post(
          'https://developer.api.autodesk.com/authentication/v2/token',
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

}

module.exports = {
    GetAPSThreeLeggedToken
}
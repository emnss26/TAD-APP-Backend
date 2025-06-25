const env = require('../../config/index.js');
const axios = require("axios");

const getIssueTypeName = async (projectId, token) => {
  const url = `${env.AUTODESK_BASE_URL}/issues/v2/containers/${projectId}/issue-types`;

  if (!token) {
    throw new Error("Token is required to fetch issue type names");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const { data } = await axios.get(url, { headers });

    return data;
  } catch (error) {
    console.error(
      "Error fetching issue type names:",
      error.response?.data || error.message
    );
    throw error;
  }
};

module.exports = {
  getIssueTypeName,
};
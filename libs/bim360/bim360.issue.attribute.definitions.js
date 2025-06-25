const env = require("../../config/index.js");
const axios = require("axios");

const getIssueAttributeDefinitions = async (projectId, token) => {
  const url = `${env.AUTODESK_BASE_URL}/issues/v2/containers/${projectId}/issue-attribute-definitions`;

  if (!token) {
    throw new Error("Token is required to fetch issue attribute definitions");
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
      "Error fetching issue attribute definitions:",
      error.response?.data || error.message
    );
    throw error;
  }
};

module.exports = {
  getIssueAttributeDefinitions,
};

const env = require("../../config/index.js");
const axios = require("axios");

const GetSubmittalSpecId = async (token, projectId, submittalSpecId) => {
  const url = `${env.AUTODESK_BASE_URL}/construction/issues/v1/projects/${projectId}/issue-attribute-definitions`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const { data } = await axios.get(url, { headers });

    return data;
  } catch (error) {
    console.error(
      "Error fetching Issue Attributes definition:",
      error.response?.data || error.message
    );
    throw error;
  }
};
module.exports = {
  GetSubmittalSpecId,
};

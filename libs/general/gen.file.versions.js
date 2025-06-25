const env = require("../../config/index.js");
const axios = require('axios');

const getFileVersions = async (token, projectId, fileId) => {
  const url = `${env.AUTODESK_BASE_URL}/data/v1/projects/${projectId}/items/${fileId}/versions`;

  if (!token) {
    throw new Error("Token is required to fetch file versions");
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
      "Error fetching file versions:",
      error.response?.data || error.message
    );
    throw error;
  }
};

module.exports = {
  getFileVersions,
};

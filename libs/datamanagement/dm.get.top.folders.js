const env = require("../../config/index");
const { default: axios } = require("axios");

const getTopFolders = async (token, accountId, projectId) => {
  url = `${env.AUTODESK_BASE_URL}/project/v1/hubs/${accountId}/projects/${projectId}/topFolders`;

  if (!token) {
    throw new Error("Token is required to fetch top folders");
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
      "Error fetching top folders:",
      error.response?.data || error.message
    );
    throw error;
  }
};

module.exports = { getTopFolders };

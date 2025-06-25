const env = require("../../config/index");
const { default: axios } = require("axios");

const getProjects = async (token, hubId) => {
  const url = `${env.AUTODESK_BASE_URL}/project/v1/hubs/${hubId}/projects`;

  if (!token) {
    throw new Error("Token is required to fetch projects");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const { data } = await axios.get(url, { headers });
    return data;
  } catch (error) {
    console.error("Error fetching projects:", error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  getProjects,
};

const env = require("../../config/index.js");
const axios = require("axios");

const getUserByUserId = async (token, projectId, userId) => {
  const url = `${env.AUTODESK_BASE_URL}/construction/admin/v1/projects/${projectId}/users/${userId}`;
  if (!token) {
    throw new Error("Token is required to fetch user data");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const { data } = await axios.get(url, { headers });
    return data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return { name: "User removed or unknown" };
    }

    console.error(
      "Error fetching user by userId:",
      error.response?.data || error.message
    );
    throw error;
  }
};

module.exports = {
  getUserByUserId,
};

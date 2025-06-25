const env = require("../../config/index");
const { default: axios } = require("axios");

const getProjectData = async (token, accountId, projectId) => {
    const url = `${env.AUTODESK_BASE_URL}/project/v1/hubs/${accountId}/projects/${projectId}`;

    if (!token) {
        throw new Error("Token is required to fetch project data");
    }

    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    try {
        const { data } = await axios.get(url, { headers });
        return data;
    } catch (error) {
        console.error("Error fetching project data:", error.response?.data || error.message);
        throw error;
    }
};

module.exports = {
    getProjectData,
};

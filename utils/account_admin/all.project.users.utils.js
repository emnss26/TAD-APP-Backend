const env = require("../../config/env.js");
const axios = require('axios');

const GetAllProjectUsers = async (token, projectId) => {
    try {
        if (!token) {
            throw new Error("Unauthorized: No token provided");
        }

        if (!projectId) {
            throw new Error("Project ID is required");
        }

        let allProjectUsers = [];
        let nextUrl = `\t${env.AUTODESK_BASE_URL}/construction/admin/v1/projects/${projectId}/users?limit=20&offset=0`;

        while (nextUrl) {
              const { data: users } = await axios.get(nextUrl, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
        
              const usersWithProjectId = users.results.map((user) => ({
                ...user,
                projectId: projectId,
              }));
        
              allProjectUsers = allProjectUsers.concat(usersWithProjectId);
              nextUrl = users.pagination.nextUrl;
            }

        return allProjectUsers;

    } catch (error) {
        console.error("Error fetching project users:", error);
        throw error;
    }
};

module.exports = { GetAllProjectUsers };

const { default: axios } = require("axios");
const { format } = require("morgan");

const GetProjectUsers = async (req, res) => {
  const token = req.cookies["access_token"];
  let projectId = req.params.projectId;

  if (projectId.startsWith("b.")) {
    projectId = projectId.substring(2);
  }

  if (!token) {
    return res.status(401).json({
      data: null,
      error: "Unauthorized",
      message: "Unauthorized",
    });
  }

  try {
    let allProjectUsers = [];
    let nextUrl = `	https://developer.api.autodesk.com/construction/admin/v1/projects/${projectId}/users?limit=20&offset=0`;

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

    //console.log('All Users:', allProjectUsers[0].projectId);

    res.status(200).json({
      data: {
        users: allProjectUsers,
      },
      error: null,
      message: "Project users fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching project users:", error.message || error);
    res.status(500).json({
      data: null,
      error: null,
      message: "Error to access the project users",
    });
  }
};

module.exports = {
  GetProjectUsers,
};

const { default: axios } = require("axios");
const { format } = require("morgan");

const projectUsersSchema = require("../../schemas/project.users.schema.js");
const  getDb  = require("../../../config/mongodb");

const { sanitize } = require("../../../libs/utils/sanitaze.db.js");

const GetProjectUsers = async (req, res) => {
  const token = req.cookies["access_token"];
  let projectId = req.params.projectId;
  const accountId = req.params.accountId;

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

    const docs = allProjectUsers.map((user) => ({
      _key: user.email,
      projectId: user.projectId,
      accountId: accountId,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      companyName: user.companyName,
      roles: user.roles,
      accessLevel: user.accessLevel,
    }));

    const db = await getDb();
    const safeAcc = sanitize(accountId);
    const safeProj = sanitize(projectId);
    const collName = `${safeAcc}_${safeProj}_users`;

    console.log("Attempting to query collection:", collName);

    const Users = db.model("Users", projectUsersSchema, collName);

    const ops = docs.map(doc => ({
      updateOne: {
        filter: { _key: doc._key, projectId: doc.projectId },
        update: { $set: doc },
        upsert: true,
      }
    }));

    if (ops.length) {
      await Users.bulkWrite(ops, { ordered: false });
    }

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
      error: error.message || error,
      message: "Error fetching project users",
    });
  }
};

module.exports = {
  GetProjectUsers,
};

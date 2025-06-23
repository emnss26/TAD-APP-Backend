const env = require("../../../config/index.js");
const { default: axios } = require("axios");
const { format } = require("morgan");

const { insertDocs, upsertDoc } = require("../../../config/database");
const { batchUpsert } = require("../../../config/database.helper.js");

const { validateUsers } = require("../../../config/database.schema.js");

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
    let nextUrl = `	${env.AUTODESK_BASE_URL}/construction/admin/v1/projects/${projectId}/users?limit=20&offset=0`;

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

    // const docsToInsert = allProjectUsers.map((user) => ({
    //   _key: user.email,
    //   email: user.email,
    //   name: user.name,
    //   firstName: user.firstName,
    //   lastName: user.lastName,
    //   status: user.status,
    //   companyName: user.companyName,
            
    // }));

    // const validDocs = [];
    // docsToInsert.forEach((doc, idx) => {
    //   const ok = validateUsers(doc);
    //   if (!ok) {
    //     console.warn(
    //       `User not valid in position ${idx}:`,
    //       validateUsers.errors
    //     );
    //   } else {
    //     validDocs.push(doc);
    //   }
    // });

    // if (validDocs.length === 0) {
    //   return res.status(400).json({
    //     data: null,
    //     error: 'Not valied document finded',
    //     message: 'Failed validation'
    //   });
    // }

    // const collectionName = `${accountId}_${projectId}_users`;
    // //console.log(`Insertando ${docsToInsert.length} docs en ${collectionName}`);
    // await batchUpsert(collectionName, validDocs, 20);
    // //console.log(" Insert result:", insertResult);


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

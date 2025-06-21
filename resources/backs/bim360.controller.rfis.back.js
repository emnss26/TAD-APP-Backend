const env = require("../../../config/env.js");
const { default: axios } = require("axios");
const { format } = require("morgan");

const { insertDocs,  upsertDoc } = require("../../../config/database");
const { batchUpsert } = require("../../../config/database.helper.js");

const {
  mapUserIdsToNames,
} = require("../../../libs/utils/user.mapper.libs.js");
const {
  fetchAllPaginatedResults,
} = require("../../../libs/utils/pagination.libs.js");

const {validateRfis } = require("../../../config/database.schema.js");

const GetRfis = async (req, res) => {
  const token = req.cookies["access_token"];
  let projectId = req.params.projectId;
  const accountId = req.params.accountId;

  if (projectId.startsWith("b.")) {
    projectId = projectId.substring(2);
  }

  if (!token) {
    return res.status(401).json({
      data: null,
      error: "No token provided",
      message: "Authorization token is required",
    });
  }

  try {
    const rfis = await fetchAllPaginatedResults(
      `${env.AUTODESK_BASE_URL}/bim360/rfis/v2/containers/${projectId}/rfis`,
      token
    );

    //console.log('RFIs data:', rfis);

    if (!Array.isArray(rfis) || rfis.length === 0) {
      return res.status(200).json({
        data: { rfis: [] },
        error: null,
        message: "No RFIs found for this project",
      });
    }
    
    const userFields = [
      "createdBy",
      "assignedTo",
      "managerId",
      "respondedBy",
      "reviewerId",
      "updatedBy",
      "closedBy",
    ];
    const userMap = await mapUserIdsToNames(rfis, projectId, token, userFields);

    //console.log ('User Map:', userMap);

    const rfisdatawithnames = rfis.map((rfi) => {
      const disciplineName =
        Array.isArray(rfi.discipline) && rfi.discipline.length > 0
          ? rfi.discipline.join(", ")
          : "Not specified";

      return {
        ...rfi,
        createdBy: userMap[rfi.createdBy] || "Unknown User",
        assignedTo: userMap[rfi.assignedTo] || "Unknown User",
        managerId: userMap[rfi.managerId] || "Unknown User",
        respondedBy: userMap[rfi.respondedBy] || "Unknown User",
        reviewerId: userMap[rfi.reviewerId] || "Unknown User",
        updatedBy: userMap[rfi.updatedBy] || "Unknown User",
        closedBy: userMap[rfi.closedBy] || "Unknown User",
        discipline: disciplineName,
      };
    });

    //console.log('RFIs with names:', rfisdatawithnames);

    // const docsToInsert = rfisdatawithnames.map((rfi) => ({
    //   _key: rfi.customIdentifier,
    //   customIdentifier: rfi.customIdentifier,
    //   title: rfi.title,
    //   discipline: rfi.discipline,
    //   priority: rfi.priority,
    //   status: rfi.status,
    //   question : rfi.question,
    //   officialResponse: rfi.officialResponse,
    //   createdBy: rfi.createdBy,
    //   assignedTo: rfi.assignedTo,
    //   managerId: rfi.managerId,
    //   respondedBy: rfi.respondedBy,
    //   respondedAt: rfi.respondedAt ? new Date(rfi.respondedAt) : null,
    //   createdAt: new Date(rfi.createdAt),
    //   reviewerId: rfi.reviewerId,
    //   updatedBy: rfi.updatedBy,
    //   dueDate: rfi.dueDate ? new Date(rfi.dueDate) : null,
    //   updatedAt: new Date(rfi.updatedAt),
    //   closedAt: rfi.closedAt ? new Date(rfi.closedAt) : null,
    //   closedBy: rfi.closedBy,
    // }));

    // const validDocs = [];
    // docsToInsert.forEach((doc, idx) => {
    //   const ok = validateRfis(doc);
    //   if (!ok) {
    //     console.warn(
    //       `RFI not valid in position ${idx}:`,
    //       validateRfis.errors
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

    // const collectionName = `${accountId}_${projectId}_rfis`;
    // //console.log(`Insertando ${docsToInsert.length} docs en ${collectionName}`);
    // await batchUpsert(collectionName, validDocs);
    // //console.log(" Insert result:", insertResult);

    res.status(200).json({
      data: {
        rfis: rfisdatawithnames,
      },
      error: null,
      message: "Rfis fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching RFIs:", error.message || error);
    res.status(500).json({
      data: null,
      error: error.message || error,
      message: "Error fetching RFIs",
    });
  }
};

module.exports = {
  GetRfis,
};

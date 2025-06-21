const env = require("../../../config/index.js");
const { default: axios } = require("axios");
const { format } = require("morgan");

const {
  mapUserIdsToNames,
} = require("../../../libs/utils/user.mapper.libs.js");
const {
  fetchAllPaginatedResults,
} = require("../../../libs/utils/pagination.libs.js");

const  getDb  = require("../../../config/mongodb");
const rfiSchema = require("../../schemas/rfis.schema.js");

const { sanitize } = require("../../../libs/utils/sanitaze.db.js");

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

    //console.log("RFIs with names:", rfisdatawithnames);

    const docs = rfisdatawithnames.map((rfi) => ({
      _key: rfi.id,
      projectId: projectId,
      accountId: accountId,
      customIdentifier: rfi.customIdentifier,
      title: rfi.title,
      discipline: rfi.discipline,
      priority: rfi.priority,
      status: rfi.status,
      question: rfi.question,
      officialResponse: rfi.officialResponse,
      createdBy: rfi.createdBy,
      assignedTo: rfi.assignedTo,
      managerId: rfi.managerId,
      respondedBy: rfi.respondedBy,
      respondedAt: rfi.respondedAt ? new Date(rfi.respondedAt) : null,
      createdAt: new Date(rfi.createdAt),
      reviewerId: rfi.reviewerId,
      updatedBy: rfi.updatedBy,
      dueDate: rfi.dueDate ? new Date(rfi.dueDate) : null,
      updatedAt: new Date(rfi.updatedAt),
      closedAt: rfi.closedAt ? new Date(rfi.closedAt) : null,
      closedBy: rfi.closedBy,
    }));

    //console.log ("projectId:", projectId);
    //console.log ("accountId:", accountId);

    const db = await getDb();
    const safeAcc = sanitize(accountId);
    const safeProj = sanitize(projectId);
    const collName = `${safeAcc}_${safeProj}_rfis`;

    const RFI = db.model("RFI", rfiSchema, collName);

    const existing = await RFI.find(
      { projectId },
      { _key: 1, updatedAt: 1 }
    ).lean();
    const existingMap = existing.reduce((m, d) => {
      m[d._key] = d.updatedAt?.getTime() || 0;
      return m;
    }, {});

    const toUpsert = docs.filter((doc) => {
      const prev = existingMap[doc._key] ?? 0;
      return !prev || doc.updatedAt.getTime() > prev;
    });

    const ops = toUpsert.map((doc) => ({
      updateOne: {
        filter: { _key: doc._key, projectId: doc.projectId },
        update: { $set: doc },
        upsert: true,
      },
    }));

    if (ops.length > 0) {
      await RFI.bulkWrite(ops, { ordered: false });
    }

    //console.log("Insert result:", ops);
    //console.log("RFIs with names:", rfisdatawithnames);
    //console.log("→ usando MongoDB database:", db);

    res.status(200).json({
      data: {
        rfis: rfisdatawithnames,
      },
      error: null,
      message: `Rfis fetched successfully & ${toUpsert.length} RFIs sincronizados.`,
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

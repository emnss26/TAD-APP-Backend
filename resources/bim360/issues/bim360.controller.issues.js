const env = require("../../../config/env.js");
const { default: axios } = require("axios");
const { format } = require("morgan");

const {
  GetIssueTypeName,
  GetIssueAttributeDefinitions,
} = require("../../../libs/bim360/bim360.libs.js");
const {
  mapUserIdsToNames,
} = require("../../../libs/utils/user.mapper.libs.js");
const {
  fetchAllPaginatedResults,
} = require("../../../libs/utils/pagination.libs.js");
const {
  buildCustomAttributeValueMap,
  enrichCustomAttributes,
} = require("../../../libs/utils/attibute.mapper.libs.js");

const  getDb  = require("../../../config/mongodb");
const issuesSchema = require("../../schemas/issues.schema.js");

const { sanitize } = require("../../../libs/utils/sanitaze.db.js");

const GetIssues = async (req, res) => {
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
    const issues = await fetchAllPaginatedResults(
      `${env.AUTODESK_BASE_URL}/issues/v2/containers/${projectId}/issues`,
      token
    );

    if (!Array.isArray(issues) || issues.length === 0) {
      return res.status(200).json({
        data: { issues: [] },
        error: null,
        message: "No Issues found for this project",
      });
    }

    const issuesTypeNameData = await GetIssueTypeName(projectId, token);

    const issueTypeMap = issuesTypeNameData.results.reduce((acc, type) => {
      acc[type.id] = type.title;
      return acc;
    }, {});

    //console.log("issuesTypeNameData:", issuesTypeNameData);

    const userFields = [
      "createdBy",
      "assignedTo",
      "closedBy",
      "openedBy",
      "updatedBy",
      "ownerId",
    ];
    const userMap = await mapUserIdsToNames(
      issues,
      projectId,
      token,
      userFields
    );

    const issuesWithUserNames = issues.map((issue) => ({
      ...issue,
      issueTypeName: issueTypeMap[issue.issueTypeId] || "Unknown Type",
      createdBy: userMap[issue.createdBy] || "Unknown User",
      assignedTo: userMap[issue.assignedTo] || "Unknown User",
      closedBy: userMap[issue.closedBy] || "Unknown User",
      openedBy: userMap[issue.openedBy] || "Unknown User",
      updatedBy: userMap[issue.updatedBy] || "Unknown User",
      ownerId: userMap[issue.ownerId] || "Unknown User",
    }));

    const attrDef = await GetIssueAttributeDefinitions(projectId, token);

    //console.log ("Attribute Definitions:", attrDef.results[0]);

    const attributeValueMap = buildCustomAttributeValueMap(attrDef.results);

    //console.log("Attribute Value Map:", attributeValueMap);

    const issuesWithReadableAttributes = enrichCustomAttributes(
      issuesWithUserNames,
      attributeValueMap
    );

    const docs = issuesWithReadableAttributes.map((issue) => ({
      _key: issue.id,
      projectId: projectId,
      accountId: accountId,
      id: issue.id,
      title: issue.title,
      displayId: issue.displayId,
      description: issue.description,
      status: issue.status,
      issueTypeName: issue.issueTypeName,
      createdAt: issue.createdAt ? new Date(issue.createdAt) : null,
      createdBy: issue.createdBy,
      openBy: issue.openedBy,
      assignedTo: issue.assignedTo,
      closedBy: issue.closedBy,
      dueDate: issue.dueDate ? new Date(issue.dueDate) : null,
      updatedAt: issue.updatedAt ? new Date(issue.updatedAt) : null,
      updatedBy: issue.updatedBy,
      closedAt: issue.closedAt ? new Date(issue.closedAt) : null,
    }));

    //console.log("projectId:", projectId);
    //console.log("accountId:", accountId);

    //console.log("issues", issuesWithReadableAttributes)
    //console.log("issues length", issuesWithReadableAttributes.length)

    const db = await getDb();
    const safeAcc = sanitize(accountId);
    const safeProj = sanitize(projectId);
    const collName = `${safeAcc}_${safeProj}_issues`;

    const Issue = db.model("Issue", issuesSchema, collName);

    const existing = await Issue.find(
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
    await Issue.bulkWrite(ops, { ordered: false });
    }

    res.status(200).json({
      data: {
        issues: issuesWithReadableAttributes,
      },
      error: null,
      message: "Issues fetched successfully",
    });
  } catch (error) {
    console.error(
      "Error fetching issues:",
      error.response?.data || error.message || error
    );

    res.status(500).json({
      data: null,
      error: error.response?.data || error.message || "Internal Server Error",
      message: "Error fetching issues",
    });
  }
};

module.exports = {
  GetIssues,
};

const env = require("../../config/env.js");
const { default: axios } = require("axios");
const { format } = require("morgan");

const { insertDocs, upsertDoc } = require("../../config/database.js");
const { batchUpsert } = require("../../config/database.helper.js");

const {
  GetIssueTypeName,
  GetIssueAttributeDefinitions,
} = require("../../libs/acc/acc.libs.js");

const {
  mapUserIdsToNames,
} = require("../../libs/utils/user.mapper.libs.js");
const {
  fetchAllPaginatedResults,
} = require("../../libs/utils/pagination.libs.js");
const {
  buildCustomAttributeValueMap,
  enrichCustomAttributes,
} = require("../../libs/utils/attibute.mapper.libs.js");

const { validateIssue } = require("../../config/database.schema.js");

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
      `${env.AUTODESK_BASE_URL}/construction/issues/v1/projects/${projectId}/issues`,
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

    //console.log("Issues with Readable Attributes:", issuesWithReadableAttributes[0]);

    // const docsToInsert = issuesWithReadableAttributes.map((issue) => ({
    //   _key: issue.id,
    //   id: issue.id,
    //   displayId: issue.displayId,
    //   title: issue.title,
    //   description: issue.description,
    //   status: issue.status,
    //   issueTypeName: issue.issueTypeName,
    //   createdAt: new Date(issue.createdAt),
    //   createdBy: issue.createdBy,
    //   assignedTo: issue.assignedTo,
    //   closedBy: issue.closedBy,
    //   dueDate: issue.dueDate ? new Date(issue.dueDate) : null,
    //   updatedAt: new Date(issue.updatedAt),
    //   closedAt: issue.closedAt ? new Date(issue.closedAt) : null,
      
    // }));

    // const validDocs = [];
    // docsToInsert.forEach((doc, idx) => {
    //   const ok = validateIssue(doc);
    //   if (!ok) {
    //     console.warn(
    //       `Issue not valid in position ${idx}:`,
    //       validateIssue.errors
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

    // const collectionName = `${accountId}_${projectId}_issues`;
    // //console.log(`Insertando ${docsToInsert.length} docs en ${collectionName}`);
    // await batchUpsert(collectionName, validDocs, 20);
    // //console.log(" Insert result:", insertResult);

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

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

const GetIssues = async (req, res) => {
  const token = req.cookies["access_token"];
  let projectId = req.params.projectId;

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
      `https://developer.api.autodesk.com/issues/v2/containers/${projectId}/issues`,
      token
    );

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

    //console.log("Issues with Readable Attributes:", issuesWithReadableAttributes);

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

const { default: axios } = require("axios");
const { format } = require("morgan");
const { GetSubmittalSpecId } = require("../../../libs/acc/acc.libs.js");

const { insertDocs, upsertDoc } = require("../../../config/database");
const { batchUpsert } = require("../../../config/database.helper.js");

const {
  mapUserIdsToNames,
} = require("../../../libs/utils/user.mapper.libs.js");
const {
  fetchAllPaginatedResults,
} = require("../../../libs/utils/pagination.libs.js");

const stateMap = {
  "sbc-1": "Waiting for submission",
  rev: "In review",
  "mgr-2": "Reviewed",
  "mgr-1": "Submitted",
  "sbc-2": "Closed",
};

const { validateSubmittals } = require("../../../config/database.schema.js");

const GetSubmittals = async (req, res) => {
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
    const submittals = await fetchAllPaginatedResults(
      `https://developer.api.autodesk.com/construction/submittals/v2/projects/${projectId}/items`,
      token
    );

    if (!Array.isArray(submittals) || submittals.length === 0) {
      return res.status(200).json({
        data: { submittals: [] },
        error: null,
        message: "No Issues found for this project",
      });
    }

    const userFields = [
      "manager",
      "createdBy",
      "updatedBy",
      "submittedBy",
      "publishedBy",
      "sentToReviewBy",
    ];

    const userMap = await mapUserIdsToNames(
      submittals,
      projectId,
      token,
      userFields
    );

    const submittalsWithUserDetails = await Promise.all(
      submittals.map(async (submittal) => {
        
        submittal.projectId = projectId;

        submittal.stateId = stateMap[submittal.stateId] || submittal.stateId;

        submittal.managerName =
          userMap[submittal.manager] || "No Manager Assigned";
        submittal.manager = userMap[submittal.manager] || "No Manager Assigned";
        submittal.subcontractorName =
          userMap[submittal.subcontractor] || "No Subcontractor Assigned";
        submittal.createdByName =
          userMap[submittal.createdBy] || "No Creator Assigned";
        submittal.respondedByName =
          userMap[submittal.respondedBy] || "No Responder Assigned";
        submittal.updatedByName =
          userMap[submittal.updatedBy] || "No Updater Assigned";
        submittal.submittedByName =
          userMap[submittal.submittedBy] || "No Submitter Assigned";
        submittal.publishedByName =
          userMap[submittal.publishedBy] || "No Publisher Assigned";
        submittal.sentToReviewByName =
          userMap[submittal.sentToReviewBy] || "No Reviewer Assigned";

        if (submittal.specId) {
          try {
            submittal.specDetails = await GetSubmittalSpecId(
              projectId,
              submittal.specId,
              token
            );
          } catch {
            submittal.specDetails = null;
          }
        } else {
          submittal.specDetails = "No Spec Assigned";
        }

        return submittal;
      })
    );

    //console.log ("Submittals with user details:", submittalsWithUserDetails     );

    const docsToInsert = submittalsWithUserDetails.map((submittal) => ({
      _key: submittal.id,
      id: submittal.id,
      title: submittal.title,
      description: submittal.description,
      stateId: submittal.stateId,
      priority: submittal.priority,
      specIdentifier: submittal.specIdentifier,
      specTitle: submittal.specTitle,
      submittedBy: submittal.submittedBy,
      submitterByName: submittal.submittedByName,
      submitterDueDate: submittal.submitterDueDate
        ? new Date(submittal.submitterDueDate)
        : null,
      managerName: submittal.managerName,
      submitterByName: submittal.submittedByName,
      submitterDueDate: submittal.submitterDueDate
        ? new Date(submittal.submitterDueDate)
        : null,
      updatedByName: submittal.updatedByName,
      publishedByName: submittal.publishedByName,
      sentToReviewByName: submittal.sentToReviewByName,
      createdAt: new Date(submittal.createdAt),
      createdBy: submittal.createdBy,
      dueDate: submittal.dueDate
        ? new Date(submittal.dueDate)
        : null,
      updatedAt: new Date(submittal.updatedAt),
      updatedBy: submittal.updatedBy,
    }));

    const validDocs = [];
    docsToInsert.forEach((doc, idx) => {
      const ok = validateSubmittals(doc);
      if (!ok) {
        console.warn(
          `submittal not valid in position ${idx}:`,
          validateSubmittals.errors
        );
      } else {
        validDocs.push(doc);
      }
    });

    if (validDocs.length === 0) {
      return res.status(400).json({
        data: null,
        error: 'Not valied document finded',
        message: 'Failed validation'
      });
    }

    const collectionName = `${accountId}_${projectId}_submittals`;
    //console.log(`Insertando ${docsToInsert.length} docs en ${collectionName}`);
    await batchUpsert(collectionName, validDocs, 20);
    //console.log(" Insert result:", insertResult);

    res.status(200).json({
      data: {
        submittals: submittalsWithUserDetails,
      },
      error: null,
      message: "Submittals fetched successfully",
    });
  } catch (error) {
    console.error(
      "Error fetching submittals:",
      error.response?.data || error.message || error
    );

    res.status(500).json({
      data: null,
      error: error.response?.data || error.message || "Internal Server Error",
      message: "Error fetching submittals",
    });
  }
};

module.exports = {
  GetSubmittals,
};

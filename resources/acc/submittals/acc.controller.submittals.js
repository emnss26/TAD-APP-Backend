const env = require("../../../config/env.js");
const { default: axios } = require("axios");
const { format } = require("morgan");

const { GetSubmittalSpecId } = require("../../../libs/acc/acc.libs.js");

const {
  mapUserIdsToNames,
} = require("../../../libs/utils/user.mapper.libs.js");
const {
  fetchAllPaginatedResults,
} = require("../../../libs/utils/pagination.libs.js");

const  getDb  = require("../../../config/mongodb");
const submittalsschema = require("../../schemas/submittals.schema.js");

const { sanitize } = require("../../../libs/utils/sanitaze.db.js");

const stateMap = {
  "sbc-1": "Waiting for submission",
  rev: "In review",
  "mgr-2": "Reviewed",
  "mgr-1": "Submitted",
  "sbc-2": "Closed",
};

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
      `${env.AUTODESK_BASE_URL}/construction/submittals/v2/projects/${projectId}/items`,
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

    const docs = submittalsWithUserDetails.map((submittal) => ({
      _key: submittal.id,
      projectId: projectId,
      accountId: accountId,
      identifier: submittal.identifier,
      id: submittal.id,
      title: submittal.title,
      description: submittal.description,
      stateId: submittal.stateId,
      priority: submittal.priority,
      specIdentifier: submittal.specIdentifier,
      specTitle: submittal.specTitle,
      submittedBy: submittal.submittedBy,
      submitterByName: submittal.submitterByName,
      submitterDueDate: submittal.submitterDueDate ? new Date(submittal.submitterDueDate) : null,
      managerName: submittal.managerName,
      updatedByName: submittal.updatedByName,
      publishedByName: submittal.publishedByName,
      publishedDate: submittal.publishedDate ? new Date(submittal.publishedDate) : null,
      sentToReviewByName: submittal.sentToReviewByName,
      createdAt: submittal.createdAt ? new Date(submittal.createdAt) : null,
      createdByName: submittal.createdByName,
      dueDate: submittal.dueDate ? new Date(submittal.dueDate) : null,
      updatedAt: submittal.updatedAt ? new Date(submittal.updatedAt) : null,
      updatedBy: submittal.updatedBy,
    }));

    //console.log ("projectId:", projectId);
    //console.log ("accountId:", accountId);
    //console.log ("Submittals:", submittalsWithUserDetails);

    const db = await getDb();
    const safeAcc = sanitize(accountId);
    const safeProj = sanitize(projectId);
    const collName = `${safeAcc}_${safeProj}_submittals`;

    const Submittal = db.model("Submittals", submittalsschema, collName);

    const existing = await Submittal.find(
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
    await Submittal.bulkWrite(ops, { ordered: false });
    }

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

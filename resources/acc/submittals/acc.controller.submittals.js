const { default: axios } = require("axios");
const { format } = require("morgan");
const { GetSubmittalSpecId} = require("../../../libs/acc/acc.libs.js");
const {mapUserIdsToNames} = require ('../../../libs/utils/user.mapper.libs.js')
const {fetchAllPaginatedResults} = require("../../../libs/utils/pagination.libs.js");

const stateMap = {
  "sbc-1": "Waiting for submission",
  "rev": "In review",
  "mgr-2": "Reviewed",
  "mgr-1": "Submitted",
  "sbc-2": "Closed",
};

const GetSubmittals = async (req, res) => {
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
    const submittals  = await fetchAllPaginatedResults(
      `https://developer.api.autodesk.com/construction/submittals/v2/projects/${projectId}/items`, 
      token
    );
      

    const userFields = [
      'manager', 'createdBy', 'updatedBy', 'submittedBy',
      'publishedBy', 'sentToReviewBy'
    ];

    const userMap = await mapUserIdsToNames(submittals, projectId, token, userFields);

    const submittalsWithUserDetails = await Promise.all(
      submittals.map(async (submittal) => {
        submittal.projectId = projectId;
    
        submittal.stateId = stateMap[submittal.stateId] || submittal.stateId;
    
        submittal.managerName = userMap[submittal.manager] || 'No Manager Assigned';
        submittal.manager = userMap[submittal.manager] || 'No Manager Assigned';
        submittal.subcontractorName = userMap[submittal.subcontractor] || 'No Subcontractor Assigned';
        submittal.createdByName = userMap[submittal.createdBy] || 'No Creator Assigned';
        submittal.respondedByName = userMap[submittal.respondedBy] || 'No Responder Assigned';
        submittal.updatedByName = userMap[submittal.updatedBy] || 'No Updater Assigned';
        submittal.submittedByName = userMap[submittal.submittedBy] || 'No Submitter Assigned';
        submittal.publishedByName = userMap[submittal.publishedBy] || 'No Publisher Assigned';
        submittal.sentToReviewByName = userMap[submittal.sentToReviewBy] || 'No Reviewer Assigned';
    
        if (submittal.specId) {
          try {
            submittal.specDetails = await GetSubmittalSpecId(projectId, submittal.specId, token);
          } catch {
            submittal.specDetails = null;
          }
        } else {
          submittal.specDetails = 'No Spec Assigned';
        }
    
        return submittal;
      })
    );

    
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

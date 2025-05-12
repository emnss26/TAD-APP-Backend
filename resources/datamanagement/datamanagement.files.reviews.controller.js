const axios = require("axios");
const { GetProjectReviews } = require("../../libs/general/revisions.libs.js");

const GetFileRevisionStatus = async (req, res) => {
  const token = req.cookies["access_token"];
  const { projectId, accountId } = req.params;
  const { itemIds } = req.body;

  if (!token) {
    return res.status(401).json({
      data: null,
      error: "No token",
      message: "Authorization required",
    });
  }
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({
      data: null,
      error: "Invalid input",
      message: "Envía un array 'itemIds' con IDs de items",
    });
  }

  try {
    const projectReviews = await GetProjectReviews(token, projectId);

    if (!Array.isArray(projectReviews)) {
      throw new Error("Formato inesperado de projectReviews");
    }

    const reviewMap = new Map(projectReviews.map(r => [r.id, r]));

    const merged = await Promise.all(
      itemIds.map(async (itemId) => {
        const url =
          `https://developer.api.autodesk.com/construction/reviews/v1/projects/${projectId}` +
          `/versions/${encodeURIComponent(itemId)}/approval-status`;

        const { data: resp } = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const result = resp.results?.[0] || {};
        const reviewId = result.review?.id || null;
        const status = result.approvalStatus?.value || "UNKNOWN";
        const label = result.approvalStatus?.label || null;
        const reviewSequenceId = result.review?.sequenceId || null;
        const reviewStatus = result.review?.status || null;

        const pr = reviewMap.get(reviewId) || {};

        return {
          itemId,
          reviewId,
          status,
          label,
          reviewStatus,
          reviewSequenceId,
          reviewName: pr.name || null,
          createdAt: pr.createdAt || null,
          createdByName: pr.createdBy?.name || pr.createdBy?.autodeskId || null,
          currentStepDueDate: pr.currentStepDueDate || null,
          updatedAt: pr.updatedAt || null,
          finishedAt: pr.finishedAt || null,
          sequenceId: pr.sequenceId || null,
          workflowId: pr.workflowId || null,
        };
      })
    );

    return res.status(200).json({
      data: merged,
      error: null,
      message: "File revision statuses fetched successfully",
    });
  } catch (err) {
    console.error("Error en GetFileRevisionStatus:", err);
    return res.status(500).json({
      data: null,
      error: err.message,
      message: "Error fetching file revision statuses",
    });
  }
};

module.exports = {
  GetFileRevisionStatus,
};

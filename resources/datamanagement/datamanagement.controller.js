const env = require("../../config/index.js");
const axios = require("axios");
const {
  GetFederatedModelFromFolders,
} = require("../../libs/general/folders.libs.js");

const MATCH_WORDS = ["FED", "FEDERADO", "FEDERATED"];

function matchesFederatedRvt(displayName = "") {
  const nameUpper = displayName.toUpperCase();

  if (!nameUpper.endsWith(".RVT")) return false;

  return MATCH_WORDS.some((w) => nameUpper.includes(w));
}

const GetFederatedModel = async (req, res) => {
  const token = req.cookies["access_token"];
  const { projectId, accountId } = req.params;

  if (!token) {
    return res.status(401).json({
      data: null,
      error: "No token provided",
      message: "Authorization token is required",
    });
  }

  try {
    const { data: topFolders } = await axios.get(
      `${env.AUTODESK_BASE_URL}/project/v1/hubs/${accountId}/projects/${projectId}/topFolders`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!topFolders.data?.length) {
      return res.status(404).json({
        data: null,
        error: "No top folders found",
        message: "The project does not have any top folders",
      });
    }

    //console.log ("Top folders:", topFolders.data);

    const projectFolder = topFolders.data.find(
      (f) =>
        f.attributes.displayName === "Project Files" ||
        f.attributes.displayName.toLowerCase() === "Archivos de proyecto"
    );

    const rootFolderId = projectFolder
      ? projectFolder.id
      : topFolders.data[0].id;

    const foundFile = await GetFederatedModelFromFolders({
      token,
      projectId,
      folderId: rootFolderId,
      filterFn: (item) => matchesFederatedRvt(item.attributes?.displayName),
    });

    if (!foundFile) {
        return res.status(404).json({
          data: null,
          error: "File not found",
          message:
            "No .rvt file containing FED / FEDERADO in its name was found",
        });
    }

    //console.log("Found file:", foundFile);

    const { data: versions } = await axios.get(
      `${env.AUTODESK_BASE_URL}/data/v1/projects/${projectId}/items/${foundFile.id}/versions`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!versions.data?.length) {
      return res.status(404).json({
        data: null,
          error: "No versions found",
          message: "No versions were found for the located file",
      });
    }

    const latestVersion = versions.data[0];

    return res.status(200).json({
      data: {
        federatedmodel: latestVersion.id,
        displayName: foundFile.attributes.displayName,
      },
      error: null,
      message: "Federated model found and version retrieved",
    });
  } catch (error) {
    console.error("Error fetching federated model:", error.message || error);
      res.status(500).json({
        data: null,
        error: null,
        message: "Error accessing the federated model",
      });
  }
};

module.exports = { GetFederatedModel };

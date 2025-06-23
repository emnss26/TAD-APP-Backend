const env = require("../../config/env.js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { GetFederatedModelFromFolders } = require("../../libs/general/folders.libs.js");
const { convertIfcToGlb } = require("../../libs/conversion/ifc-to-glb.js");

const MATCH_WORDS = ["FED-IFC", "FEDERADO-IFC", "FEDERATED-IFC"]; 

function matchesFederatedIfc(displayName = "") {
  const nameUpper = displayName.toUpperCase();
  if (!nameUpper.endsWith(".IFC")) return false;
  return MATCH_WORDS.some((w) => nameUpper.includes(w));
}

const GetIFCFederatedModel = async (req, res) => {
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

    const projectFolder = topFolders.data.find(
      (f) =>
        f.attributes.displayName === "Project Files" ||
        f.attributes.displayName.toLowerCase() === "archivos de proyecto"
    );
    const rootFolderId = projectFolder ? projectFolder.id : topFolders.data[0].id;

    const foundFile = await GetFederatedModelFromFolders({
      token,
      projectId,
      folderId: rootFolderId,
      filterFn: (item) => matchesFederatedIfc(item.attributes?.displayName),
    });

    if (!foundFile) {
      return res.status(404).json({
        data: null,
        error: "File not found",
        message: "No .ifc file containing FED-IFC in its name was found",
      });
    }

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

    const storageUrl = latestVersion.relationships.storage.meta.link.href;
    const response = await axios.get(storageUrl, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "stream",
    });
    const tmpIfcPath = path.join("/tmp", `ifc_${Date.now()}.ifc`);
    const writer = fs.createWriteStream(tmpIfcPath);
    await new Promise((resolve, reject) => {
      response.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    const tmpGlbPath = path.join("/tmp", `ifc_${Date.now()}.glb`);
    await convertIfcToGlb(tmpIfcPath, tmpGlbPath);

    const glbUrl = `${env.BACKEND_BASE_URL}/public/files/${path.basename(tmpGlbPath)}`;

    return res.status(200).json({
      data: {
        glbUrl,
        displayName: foundFile.attributes.displayName,
      },
      error: null,
      message: "Federated IFC model found, converted and ready for VR",
    });
  } catch (error) {
    console.error("Error processing federated IFC model:", error.message || error);
    res.status(500).json({
      data: null,
      error: error.message,
      message: "Error accessing or converting the federated IFC model",
    });
  }
};

module.exports = { GetIFCFederatedModel };

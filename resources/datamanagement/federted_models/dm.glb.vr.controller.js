const env = require("../../../config/index.js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const {
  GetFederatedModelFromFolders,
} = require("../../../libs/general/folders.libs.js");
const { execFile } = require("child_process");

const {
  getTopFolders,
} = require("../../../libs/datamanagement/dm.get.top.folders.js");

const os = require("os");
const { URL } = require("url");

const MATCH_WORDS = ["FED-IFC", "FEDERADO-IFC", "FEDERATED-IFC"];

function getIfcConvertExecutablePath() {
  const base = path.join(__dirname, "../../../node_modules/ifc-converter/bin/");
  if (process.platform === "win32") return path.join(base, "IfcConvert-win.exe");
  if (process.platform === "darwin") return path.join(base, "IfcConvert-darwin");
  return path.join(base, "IfcConvert"); // Linux
}

function convertIfcToGlb(inputIfcPath, outputGlbPath) {
  return new Promise((resolve, reject) => {
    const converterPath = getIfcConvertExecutablePath();
    execFile(
      converterPath,
      [inputIfcPath, outputGlbPath],
      (error, stdout, stderr) => {
        if (error) {
          reject(stderr || error);
        } else {
          resolve(stdout);
        }
      }
    );
  });
}

function matchesFederatedIfc(displayName = "") {
  const nameUpper = displayName.toUpperCase();
  if (!nameUpper.endsWith(".IFC")) return false;
  return MATCH_WORDS.some((w) => nameUpper.includes(w));
}

const GetGLBFederatedModel = async (req, res) => {
  const token = req.cookies["access_token"];
  const { projectId, accountId } = req.params;

  if (!token) {
    return res.status(401).json({
      data: null,
      error: "No token provided",
      message: "Authorization token is required",
    });
  }

  //console.log("Token:", token);

  try {
    const topFolders = await getTopFolders(token, accountId, projectId);

    if (!topFolders.data?.length) {
      return res.status(404).json({
        data: null,
        error: "No top folders found",
        message: "The project does not have any top folders",
      });
    }

    //console.log("Top folders:", topFolders.data);

    const projectFolder = topFolders.data.find(
      (f) =>
        f.attributes.displayName === "Project Files" ||
        f.attributes.displayName.toLowerCase() === "archivos de proyecto"
    );
    const rootFolderId = projectFolder
      ? projectFolder.id
      : topFolders.data[0].id;

    const foundFile = await GetFederatedModelFromFolders({
      token,
      projectId,
      folderId: rootFolderId,
      filterFn: (item) => matchesFederatedIfc(item.attributes?.displayName),
    });

    //console.log("Found file:", foundFile);

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

    const urldownloadUrl = latestVersion.relationships.storage.meta.link.href;

    const urlObj = new URL(urldownloadUrl);
    urlObj.search = "";
    const urlForSignedDownload = urlObj.toString();

    console.log("Download URL:", urlForSignedDownload);

    const getDownload = async (token) => {
      try {
        const response = await axios.get(`${urlForSignedDownload}/signeds3download`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        console.log("Download response:", response.data);
        return response.data.url;
      } catch (error) {
        console.error("Error getting download URL:", error.message || error);
        throw error;
      }
    };

    const downloadUrl = await getDownload(token);
    console.log("Download URL:", downloadUrl);

    const tmpDir = os.tmpdir();
    const tmpIfcPath = path.join(tmpDir, `ifc_${Date.now()}.ifc`);
    const tmpGlbPath = path.join(tmpDir, `ifc_${Date.now()}.glb`);
    const response = await axios.get(downloadUrl, { responseType: "stream" });
    const writer = fs.createWriteStream(tmpIfcPath);
    await new Promise((resolve, reject) => {
      response.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    await convertIfcToGlb(tmpIfcPath, tmpGlbPath);

    const publicFilesDir = path.join(__dirname, "../../../public/files");
    if (!fs.existsSync(publicFilesDir)) {
      fs.mkdirSync(publicFilesDir, { recursive: true });
    }
    const finalGlbPath = path.join(publicFilesDir, path.basename(tmpGlbPath));
    fs.copyFileSync(tmpGlbPath, finalGlbPath);

    // 8. Retorna la URL pública
    const glbUrl = `${env.BACKEND_BASE_URL}/public/files/${path.basename(finalGlbPath)}`;

    console.log("GLB URL:", glbUrl);

    return res.status(200).json({
      data: {
        glbUrl,
        displayName: foundFile.attributes.displayName,
      },
      error: null,
      message: "Federated IFC model found, converted and ready for VR",
    });
  } catch (error) {
    console.error(
      "Error processing federated IFC model:",
      error.message || error
    );
    res.status(500).json({
      data: null,
      error: error.message,
      message: "Error accessing or converting the federated IFC model",
    });
  }
};

module.exports = { GetGLBFederatedModel };

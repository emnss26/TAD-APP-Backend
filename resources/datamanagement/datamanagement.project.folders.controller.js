const env = require("../../config/index.js");
const { default: axios } = require("axios");

const { format } = require("morgan");
 const { GetFolderContent, GetFileVersions } = require("../../libs/utils/folders.content");

const GetFoldersStructure = async (req, res) => {
  const token = req.cookies["access_token"];
  let projectId = req.params.projectId;
  const accountId = req.params.accountId;

  if (!token) {
    return res.status(401).json({
      data: null,
      error: "No token provided",
      message: "Authorization token is required",
    });
  }

  try {
    const topFolders = await axios.get(
      `${env.AUTODESK_BASE_URL}/project/v1/hubs/${accountId}/projects/${projectId}/topFolders`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const foldersArray = topFolders.data.data;

    console.debug("Top folders:", foldersArray);

    const projectFolder = foldersArray.find(
      (f) =>
        f.attributes.displayName === "Project Files" ||
        f.attributes.displayName.toLowerCase() === "Archivos de proyecto"
    );

    const rootFolderId = projectFolder
      ? projectFolder.id
      : foldersArray.data[0].id;

      const projectStructure = await GetFolderContent(token, projectId, rootFolderId);

      const filesWithVersions = await Promise.all(projectStructure.map(async item => {
            if (item.type === 'file') {
                const versions = await GetFileVersions(token, projectId, item.id);
                return {
                    ...item,
                    versions: versions
                };
            }
            return item;
        }));

        res.status(200).json({
            data: filesWithVersions,
            error: null,
            message: "Project structure fetched successfully"
        });


  } catch (error) {
    console.error("Error in GetFoldersStructure:", error);
    return res.status(500).json({
      data: null,
      error: error.message,
        message: "Error fetching folder structure",
    });
  }
};

module.exports = {  
    GetFoldersStructure,
    };
    

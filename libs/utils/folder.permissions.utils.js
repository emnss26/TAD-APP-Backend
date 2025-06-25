const env = require("../../config/index.js");
const axios = require("axios");

/**
 * Retrieves permissions for multiple folders with limited concurrency.
 * @param {string} token - Access token.
 * @param {string} projectId - Project ID.
 * @param {Array<{id:string,name:string}>} folders - List of folders.
 * @returns {Promise<Array<{folderId:string,folderName:string,permissions:Array<Object>}>>}
 */
async function GetFolderPermissions(token, projectId, folders) {
  // Dynamic import to support ESM
  const { default: pLimit } = await import("p-limit");
  const limit = pLimit(5);

  const calls = folders.map((f) =>
    limit(async () => {
      const { data } = await axios.get(
        `${env.AUTODESK_BASE_URL}/bim360/docs/v1/projects/${projectId}/folders/${f.id}/permissions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const subjectPerms = data
      //console.log("Data:", data);
      return {
        folderId: f.id,
        folderName: f.name,
        permissions: subjectPerms,
      };
    })
  );

  return Promise.all(calls);
}

module.exports = { GetFolderPermissions };

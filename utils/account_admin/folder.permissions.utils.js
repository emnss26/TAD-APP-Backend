const axios = require("axios");

/**
 * Obtiene permisos de múltiples carpetas con concurrencia limitada.
 * @param {string} token - Token de acceso.
 * @param {string} projectId - ID del proyecto.
 * @param {Array<{id:string,name:string}>} folders - Lista de carpetas.
 * @returns {Promise<Array<{folderId:string,folderName:string,permissions:Array<Object>}>>}
 */
async function GetFolderPermissions(token, projectId, folders) {
  // Import dinámico para soportar ESM
  const { default: pLimit } = await import("p-limit");
  const limit = pLimit(5);

  const calls = folders.map((f) =>
    limit(async () => {
      const { data } = await axios.get(
        `https://developer.api.autodesk.com/bim360/docs/v1/projects/${projectId}/folders/${f.id}/permissions`,
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

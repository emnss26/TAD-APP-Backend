const axios = require("axios");

/**
 * Recorre recursivamente las carpetas y devuelve el primer item que cumpla
 *   filterFn(item) === true   ó   displayName incluye matchWord
 *
 * @param {Object} params
 * @param {string} params.token
 * @param {string} params.projectId
 * @param {string} params.folderId
 * @param {string} [params.matchWord]
 * @param {Function} [params.filterFn]  
 */
const GetFederatedModelFromFolders = async ({
  token,
  projectId,
  folderId,
  matchWord,
  filterFn,
}) => {
  const url = `https://developer.api.autodesk.com/data/v1/projects/${projectId}/folders/${folderId}/contents`;

  const { data: folderContent } = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!folderContent.data?.length) return null;

  const items   = folderContent.data.filter((i) => i.type === "items");
  const folders = folderContent.data.filter((i) => i.type === "folders");

  /* 1) Revisa los files (.items) de la carpeta actual */
  for (const item of items) {
    const name = (item.attributes?.displayName || "").toLowerCase();

    const passesFilter =
      (filterFn && filterFn(item)) ||
      (matchWord && name.includes(matchWord.toLowerCase()));

    if (passesFilter) return item;
  }

  for (const sub of folders) {
    const found = await GetFederatedModelFromFolders({
      token,
      projectId,
      folderId: sub.id,
      matchWord,
      filterFn,      
    });
    if (found) return found;
  }

  return null;
};

module.exports = { GetFederatedModelFromFolders };

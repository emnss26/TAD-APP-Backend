const env = require("../../config/index.js");
const axios = require("axios");

async function getRootFolderId(token, accountId, projectId) {
  const { data } = await axios.get(
    `${env.AUTODESK_BASE_URL}/project/v1/hubs/${accountId}/projects/${projectId}/topFolders`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const top = data.data || [];
  if (!top.length) throw new Error("No top folders found");
  const pf = top.find(
    (f) =>
      f.attributes.displayName === "Project Files" ||
      f.attributes.displayName.toLowerCase() === "archivos de proyecto"
  );
  return (pf || top[0]).id;
}

async function listFoldersRecursively(token, projectId, folderId) {
  const { data } = await axios.get(
    `${env.AUTODESK_BASE_URL}/data/v1/projects/${projectId}/folders/${folderId}/contents`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const items = data.data || [];
  const folders = items.filter((i) => i.type === "folders");

  const result = folders.map((f) => ({
    id: f.id,
    name: f.attributes.displayName,
  }));

  for (const f of folders) {
    const sub = await listFoldersRecursively(token, projectId, f.id);
    result.push(...sub);
  }

  return result;
}

async function GetAllProjectFolders(token, accountId, projectId) {
  const rootId = await getRootFolderId(token, accountId, projectId);

  return listFoldersRecursively(token, projectId, rootId);
}

module.exports = { GetAllProjectFolders };

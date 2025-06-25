const { default: axios } = require("axios");

const {
  GetAllProjectFolders,
} = require("../../../libs/utils/all.project.folders.utils.js");
const {
  GetAllProjectUsers,
} = require("../../../libs/utils/all.project.users.utils.js");
const {
  GetFolderPermissions,
} = require("../../../libs/utils/folder.permissions.utils.js");

async function GetFolderPermits(req, res) {
  const token = req.cookies["access_token"];
  const { accountId, projectId } = req.params;
  if (!token) {
    return res.status(401).json({ data: null, error: 'Unauthorized', message: 'Unauthorized' });
  }

  try {
    const folders = await GetAllProjectFolders(token, accountId, projectId);
    //console.log("folders:", folders);

    const users = await GetAllProjectUsers(token, projectId);
    //console.log("users:", users);

    const permsByFolder = await GetFolderPermissions(token, projectId, folders);
    //console.log("permsByFolder:", permsByFolder);

    const enriched = permsByFolder.map(
      ({ folderId, folderName, permissions }) => {
        const individualIds = new Set(
          permissions
            .filter((p) => p.subjectType === "USER")
            .map((p) => p.subjectId)
        );

        const perms = permissions.flatMap((p) => {
          if (p.subjectType === "COMPANY") {
            const members = users.filter(
              (u) => u.companyId === p.subjectId && !individualIds.has(u.id)
            );
            if (members.length === 0) return [];
            return {
              ...p,
              users: members,
              actions: p.actions.length ? p.actions : p.inheritActions,
            };
          }

          const u = users.find((u) => u.id === p.subjectId);
          return {
            ...p,
            users: u ? [u] : [],
            actions: p.actions.length ? p.actions : p.inheritActions,
          };
        });

        return { folderId, folderName, permissions: perms };
      }
    );

    const flattened = enriched.map(({ folderId, folderName, permissions }) => {
      const perms = permissions.flatMap((p) => {
        if (p.subjectType === "USER") {
          return [{ email: p.email, actions: p.actions }];
        }
      
        if (p.subjectType === "COMPANY" && Array.isArray(p.users)) {
          return p.users.map((u) => ({
            email: u.email,
            actions: p.actions,
          }));
        }
        return [];
      });

      const unique = Array.from(
        perms
          .reduce((acc, cur) => {
            
            if (acc.has(cur.email)) {
              const prev = acc.get(cur.email);
              const merged = Array.from(
                new Set([...prev.actions, ...cur.actions])
              );
              acc.set(cur.email, { email: cur.email, actions: merged });
            } else {
              acc.set(cur.email, { ...cur });
            }
            return acc;
          }, new Map())
          .values()
      );

      return { folderId, folderName, permissions: unique };
    });

    return res.json({
      data: {
        folders: folders,
        users: users,
        permissions: permsByFolder,
        enrichedPermissions: enriched,
        flattenFolderPermissions: flattened,
      },
      error: null,
      message: "Folder permits retrieved successfully",
    });
  } catch (err) {
    console.error("GetFolderPermits:", err);
    return res.status(500).json({ data: null, error: err.message, message: 'Internal server error' });
  }
}

module.exports = { GetFolderPermits };

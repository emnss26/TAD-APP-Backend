const express =  require ('express');

const axios = require('axios');

const cache = {};

const  GetFolderContent = async (token, projectId, folderId) => {

     const cacheKey = `${projectId}-${folderId}`;

    
    if (cache[cacheKey]) {
        console.log(`Cache hit for folder: ${folderId}`);
        return cache[cacheKey]; 
    }

    try {
        const { data: folderContent } = await axios.get(
            `https://developer.api.autodesk.com/data/v1/projects/${projectId}/folders/${folderId}/contents`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const folders = folderContent.data.filter(item => item.type === 'folders');
        const files = folderContent.data.filter(item => item.type === 'items');

        const children = await Promise.all(
            folders.map(async folder => ({
                id: folder.id,
                name: folder.attributes.name,
                type: 'folder',
                children: await GetFolderContent(token, projectId, folder.id),
            }))
        );

        const result = [
            ...children,
            ...files.map(file => ({
                id: file.id,
                name: file.attributes.displayName,
                type: 'file',
                versiontype: file.attributes.extension.type === 'versions:autodesk.bim360:File' ? file.attributes.extension.data.id : null,
                version: file.attributes.extension.version,
                version_urn: file.relationships.tip.data.id,
                versionschema: file.attributes.extension.schema,
            })),
        ];

     
        cache[cacheKey] = result;

        return result;

    } catch (error) {
        console.error("Error en GetFolderContent:", error);
        return res.status(500).json({
            data: null,
            error: error.message,
            message: "Error al obtener el contenido de la carpeta",
        });
    }
}

const GetFileVersions = async (token, projectId, fileId) => {
    try {
        const { data } = await axios.get(`https://developer.api.autodesk.com/data/v1/projects/${projectId}/items/${fileId}/versions`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return data.data; 
    } catch (error) {
        console.error('Error fetching file versions:', error.message || error);
        return []; 
    }
};

module.exports = {
    GetFolderContent,
    GetFileVersions
};
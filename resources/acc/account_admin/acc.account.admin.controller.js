const { default: axios } = require("axios");
const { AUTHORIZED_HUBS: authorizedHubs } = require("../../../config/index.js");
const { getHubs } = require("../../../libs/datamanagement/dm.get.hubs.js");
const { getProjects } = require("../../../libs/datamanagement/dm.get.projects.js");

const GetProjects = async (req, res) => {
  const token = req.cookies["access_token"];

  if (!token) {
    return res.status(401).json({
      data: null,
      error: "Unauthorized",
      message: "Unauthorized",
    });
  }

  try {
    
    const hubsdata = await getHubs(token);

    const targetHubs = hubsdata.data.filter((hub) =>
      authorizedHubs.some((authHub) => authHub.id === hub.id)
    );

    if (!targetHubs.length) {
      return res.status(404).json({
        data: null,
        error: "Hub not found",
        message: "Not auuthorized hubs found",
      });
    }

    const projectsArrays = await Promise.all(
      targetHubs.map(async (hub) => {
        try {
          const projectsData = await getProjects(token, hub.id);
          // Asegúrate de extraer el array de proyectos correctamente
          return Array.isArray(projectsData.data) ? projectsData.data : [];
        } catch (error) {
          console.error(
            `Error fetching projects for hub ${hub.id}:`,
            error.message || error
          );
          return [];
        }
      })
    );

    const allProjects = projectsArrays.flat();

    // Filtra solo los proyectos tipo ACC
    const accProjects = allProjects.filter(
      (project) =>
        project?.attributes?.extension?.data?.projectType === "ACC"
    );

    return res.status(200).json({
      data: { projects: accProjects },
      error: null,
      message: "Access to projects",
    });
  } catch (error) {
    console.error("Error fetching projects:", error.message || error);
    res.status(500).json({
      data: null,
      error: error.message,
      message: "Error al obtener los proyectos",
    });
  }
};

module.exports = {
  GetProjects,
};

const env = require("../../../config/index.js");
const { default: axios } = require("axios");
const { format } = require("morgan");
const { AUTHORIZED_HUBS: authorizedHubs } = require("../../../config/index.js");

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
    

    const { data: hubsdata } = await axios.get(
      `${env.AUTODESK_BASE_URL}/project/v1/hubs`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    //console.log("Hubs", hubsdata);

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

    //console.log('Target Hubs:', targetHubs);

    const projectsPromises = targetHubs.map((hub) => {
      return axios
        .get(
          `${env.AUTODESK_BASE_URL}/project/v1/hubs/${hub.id}/projects`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        .then((response) => response.data.data)
        .catch((error) => {
          console.error(
            `Error fetching projects for hub ${hub.id}:`,
            error.message || error
          );
          return [];
        });
    });

    const projectsArrays = await Promise.all(projectsPromises);

    const allProjects = projectsArrays.flat();

    //console.log ('All Projects',allProjects)

    const accProjects = allProjects.filter(
      (project) =>
        project.attributes &&
        project.attributes.extension &&
        project.attributes.extension.data &&
        project.attributes.extension.data.projectType === "ACC"
    );

    res.status(200).json({
      data: {
        projects: accProjects,
      },
      error: null,
      message: "Access to proyects",
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

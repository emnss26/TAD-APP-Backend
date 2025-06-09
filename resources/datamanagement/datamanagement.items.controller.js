const axios = require("axios");

const GetFileData = async (req, res) =>{
  const token = req.cookies["access_token"];
  const projectId = req.params.projectId;
  const accountId = req.params.accountId;

  const { itemIds } = req.body;

  if (!token) {
    return res.status(401).json({
      data: null,
      error: "No token provided",
      message: "Authorization token is required",
    });
  }

  if (!Array.isArray(itemIds)) {
    return res.status(400).json({
      data: null,
      error: "Invalid input",
      message: "Items should be an array",
    });
  }

  try {
    const itemsDetails = await Promise.all(
      itemIds.map(async (itemId) => {
        const url = `https://developer.api.autodesk.com/data/v1/projects/${projectId}/items/${itemId}`;

        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        return {
          data: res.data.data,
          included: res.data.included,
        };
      })
    );

    return res.status(200).json({
      data: itemsDetails,
      error: null,
      message: "File versions fetched successfully",
    });
  } catch (error) {
    console.error("Error in GetFileVersions:", error);
    return res.status(500).json({
      data: null,
      error: error.message,
      message: "Error fetching file versions",
    });
  }
}

module.exports = {
  GetFileData,
};

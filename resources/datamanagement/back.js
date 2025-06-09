const GetProjectRevision = async (req, res) => {
  const token = req.cookies["access_token"];
  const { projectId } = req.params;

  if (!token) {
    return res.status(401).json({
      data: null,
      error: "No token provided",
      message: "Authorization token is required",
    });
  }

  try {
    const url = `https://developer.api.autodesk.com/construction/reviews/v1/projects/${projectId}/reviews`;
    const axiosResponse = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return res.status(200).json({
      data: axiosResponse.data,
      error: null,
      message: "Project reviews fetched successfully",
    });
  } catch (error) {
    console.error("Error in GetProjectRevision:", error);
    return res.status(500).json({
      data: null,
      error: error.message,
      message: "Error fetching project reviews",
    });
  }
};
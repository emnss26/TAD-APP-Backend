const express = require("express");

const { GoogleGenerativeAI } = require("@google/generative-ai");
const getDb  = require("../../config/mongodb.js");
const projectUsersSchema = require("../../resources/schemas/project.users.schema.js");
const { sanitize } = require("../../libs/utils/sanitaze.db.js");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const router = express.Router();

router.post("/users", async (req, res) => {
  let { message, accountId, projectId } = req.body;

  if (!message || !accountId || !projectId) {
    return res.status(400).json({ data: null, error: 'Missing required fields', message: 'Missing required fields' });
  }

  if (!process.env.GOOGLE_API_KEY) {
    return res.status(500).json({ data: null, error: 'Google API key not set', message: 'Google API key not set' });
  }

  try {
    console.debug(
      "Received request to Google AI with message:",
      message,
      "Account ID:",
      accountId,
      "Project ID:",
      projectId
    );
    const db = await getDb();

    if (projectId.startsWith("b.")) {
      projectId = projectId.substring(2);
      console.debug("Project ID (modified):", projectId);
    }

    const safeAcc = sanitize(accountId);
    const safeProj = sanitize(projectId);

    const collectionName = `${safeAcc}_${safeProj}_users`;
    console.debug("Attempting to query collection:", collectionName);
    const Users = db.model("Users", projectUsersSchema, collectionName);

    const users = await Users.find({}).lean().exec();

    console.debug("Users found:", users.length);
    console.debug("Users data:", users);

    const totalUsers = users.length;
    const activeUsers = users.filter((user) => user.status === "active").length;
    const pendingUsers = users.filter(
      (user) => user.status === "pending"
    ).length;

    if (!users || users.length === 0) {
      return res.status(404).json({ data: null, error: 'No users found', message: 'No users found' });
    }

    const usersData = users
      .map((user) => {
        const roleNames = Array.isArray(user.roles)
          ? user.roles.map((role) => role?.name || "Unnamed Role").join(", ")
          : "No Roles Assigned";

        const accessLevelInfo = Array.isArray(user.accessLevel)
          ? user.accessLevel.join(", ")
          : "N/A";

        return `Name: ${user.name || "N/A"}, 
            Email: ${user.email || "N/A"}, 
            First Name: ${user.firstName || "N/A"},
            Last Name: ${user.lastName || "N/A"},
            Status: ${user.status || "N/A"},
            Company Name: ${user.companyName || "N/A"},
            Access Level: ${accessLevelInfo},
            Role: ${roleNames}`;
      })
      .join("\n");

    const usersInfo =
      totalUsers > 0
        ? usersData
        : "No users found in the database for this project.";

    const countsSummary = `Project User Counts: Total=${totalUsers}, Active=${activeUsers}, Pending=${pendingUsers}.`;

    const fullPrompt = `
      You are a virtual assistant specialized in managing user data within Autodesk Construction Cloud (ACC) for construction projects.
      Your role is to assist users in obtaining information about the project team members based ONLY on the provided data.

      Here are some summary counts based on the data: ${countsSummary}

      You can answer questions related to the ACC users listed below, such as:
      - What is the full name, email, status, or company of a specific user?
      - What roles or access levels does a specific user have?
      - List users belonging to a specific company or having a specific role/status.
      - Provide the pre-calculated counts when asked (e.g., total users, active users).

      Use ONLY the following detailed user information to answer other questions:
      --- USER DATA START ---
      ${usersInfo}
      --- USER DATA END ---

      Strictly base your answer on the data provided above. If the information is not present in the data, state that you don't have that specific information.
      If asked for a count already provided in the summary, use that value directly.
      For other questions, analyze the detailed user list.

      Please respond clearly in English and concisely to the following question: ${message}
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });

    const generationConfig = {
      temperature: 0.2,
    };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig, // Pass the configuration here
  }   );
    const response = await result.response;
    const reply = response.text();

    if (!reply) {
      console.warn(
        "Google AI response was empty or blocked. Full response:",
        response
      );

      let reason = response?.candidates?.[0]?.finishReason || "Unknown reason";
      let safetyRatings = JSON.stringify(
        response?.promptFeedback?.safetyRatings || {}
      );
      return res.status(500).json({
        data: null,
        error: `No response from Google AI. Reason: ${reason}. Safety Ratings: ${safetyRatings}`,
        message: 'AI response empty'
      });
    }

    res.json({ data: { reply }, error: null, message: null });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ data: null, error: 'Internal server error', message: 'Internal server error' });
  }
});

module.exports = router;

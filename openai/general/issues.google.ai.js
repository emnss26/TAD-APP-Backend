const env = require('../../config/index.js');
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const getDb  = require("../../config/Mongo_DB_Database/mongodb.js");

const issuesSchema = require("../../resources/schemas/issues.schema.js");

const { sanitize } = require("../../libs/utils/sanitaze.db.js");

const genAI = new GoogleGenerativeAI(env.GOOGLE_API_KEY);

const router = express.Router();

router.post("/issues", async (req, res) => {
  let { message, accountId, projectId } = req.body;

  if (!message || !accountId || !projectId) {
    return res.status(400).json({ data: null, error: 'Missing required fields', message: 'Missing required fields' });
  }


  if (!process.env.GOOGLE_API_KEY) {
    return res.status(500).json({ data: null, error: 'Google API key not set', message: 'Google API key not set' });

  }

  try {
    console.debug(
      "Received request to Google AI Issues with message:",
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

    const collectionName = `${safeAcc}_${safeProj}_issues`;
    console.debug("Attempting to query collection:", collectionName);

    const Issues = db.model("Issues", issuesSchema, collectionName);

    const issues = await Issues.find({}).lean().exec();
    console.debug("Issues found:", issues.length);

    const totalIssues = issues.length;
    const openIssues = issues.filter((issue) => issue.status === "open").length;
    console.debug("Open Issues:", openIssues);
    const closedIssues = issues.filter(
      (issue) => issue.status === "closed"
    ).length;
    console.debug("Closed Issues:", closedIssues);
    const inreviewIssues = issues.filter(
      (issue) => issue.status === "in_review" || issue.status === "in review"
    ).length;
    console.debug("In Review Issues:", inreviewIssues);

    if (totalIssues === 0) {
      return res.json({ data: { reply: 'I found no issues data for this project.' }, error: null, message: null });
    }

    const formattedIssuesData = issues
      .map((issue) => {
        let customAttributesString = "None";
        if (
          Array.isArray(issue.customAttributes) &&
          issue.customAttributes.length > 0
        ) {
          customAttributesString = issue.customAttributes
            .map(
              (attr) =>
                `${attr?.name || "Unnamed Attribute"}: ${attr?.value || "N/A"}`
            )
            .join(", ");
        }

        const formatDate = (dateString) => {
          if (!dateString) return "N/A";
          try {
            return new Date(dateString).toLocaleDateString();
          } catch (e) {
            return dateString;
          }
        };

        return (
          `Issue ID: ${issue.displayId || issue.id || "N/A"}\n` +
          `  Title: ${issue.title || "N/A"}\n` +
          `  Status: ${issue.status || "N/A"}\n` +
          `  Assigned To: ${issue.assignedTo || "N/A"}\n` +
          `  Description: ${issue.description || "N/A"}\n` +
          `  Type Name: ${issue.issueTypeName || "N/A"}\n` +
          `  Created At: ${formatDate(issue.createdAt)}\n` +
          `  Created By: ${issue.createdBy || "N/A"}\n` +
          `  Due Date: ${formatDate(issue.dueDate)}\n` +
          `  Updated At: ${formatDate(issue.updatedAt)}\n` +
          `  Closed At: ${formatDate(issue.closedAt)}\n` +
          `  Custom Attributes: ${customAttributesString}`
        );
      })
      .join("\n---\n");

    const countsSummary = `Total Issues: ${totalIssues}, Open: ${openIssues}, Closed: ${closedIssues}, In Review: ${inreviewIssues}.`;

    const fullPrompt = `You are a virtual assistant specialized in managing issue data within Autodesk Construction Cloud (ACC) for construction projects.
Your role is to assist users in obtaining information about the project issues based ONLY on the provided data.

Here is a summary of the issue counts: ${countsSummary}

You can answer questions based on the detailed issue list below, such as:
- What are the open/closed/in review issues?
- Who is assigned to issue ID [ID]?
- What is the status or due date for issue ID [ID]?
- Find issues assigned to a specific person.
- Find issues with a specific title or description keyword.
- What are the custom attributes for issue ID [ID]?

Use ONLY the following detailed issue information to answer questions. Do not use prior knowledge.
--- ISSUES DATA START ---
${formattedIssuesData}
--- ISSUES DATA END ---

Strictly base your answer on the data provided above. If the information is not present in the data, state that you don't have that specific information.
If asked for a count already provided in the summary, use that value directly. Use the 'Issue ID' (displayId if available) when referring to specific issues.

Please respond clearly in English and concisely to the following question: ${message}
`;

    // console.log("Prompt being sent to AI:", fullPrompt); // Uncomment to debug the full prompt

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
    const generationConfig = { temperature: 0.2 };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig,
    });
    const response = await result.response;

    // Handle potential missing text in the response (may happen if it was blocked or an error occurred)
    if (
      !response ||
      !response.candidates ||
      response.candidates.length === 0 ||
      !response.candidates[0].content ||
      !response.candidates[0].content.parts ||
      response.candidates[0].content.parts.length === 0 ||
      !response.candidates[0].content.parts[0].text
    ) {
      console.warn(
        "Google AI response text part is missing or empty. Full response:",
        JSON.stringify(response, null, 2)
      );
      let reason = response?.candidates?.[0]?.finishReason || "Unknown reason";
      let safetyRatings = JSON.stringify(
        response?.promptFeedback?.safetyRatings || {}
      );
      
      if (reason === "SAFETY") {
        return res
          .status(500)
          .json({
            error: `Google AI blocked the response due to safety concerns. Ratings: ${safetyRatings}`,
          });
      } else {
        return res
          .status(500)
          .json({
            error: `No valid response text from Google AI. Reason: ${reason}. Safety Ratings: ${safetyRatings}`,
          });
      }
    }

    const reply = response.candidates[0].content.parts[0].text.trim();

    res.json({ data: { reply }, error: null, message: null });
  } catch (error) {
    console.error("Error processing /ai/issues request:", error);
    if (error.message.includes("collection")) {
      res
        .status(500)
        .json({ data: null, error: 'Database error while processing issues.', message: 'Database error' });
    } else {
      res
        .status(500)
        .json({ data: null, error: 'Internal server error processing the issues request.', message: 'Internal server error' });
    }
  }
});

module.exports = router;

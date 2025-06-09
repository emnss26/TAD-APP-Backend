const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const  getDb  = require("../../config/mongodb.js");
const submittalsSchema = require("../../resources/schemas/submittals.schema.js");
const { sanitize } = require("../../libs/utils/sanitaze.db.js");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const router = express.Router();

router.post("/submittals", async (req, res) => {
  const { message, accountId, projectId } = req.body;
  if (!message || !accountId || !projectId) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (!process.env.GOOGLE_API_KEY) {
    return res.status(500).json({ error: "Google API key not set" });
  }

  try {
    const db = await getDb();
    const projId = projectId.startsWith("b.") ? projectId.substring(2) : projectId;
    const coll = `${sanitize(accountId)}_${sanitize(projId)}_submittals`;
    const Submittals = db.model("Submittals", submittalsSchema, coll);
    const subs = await Submittals.find({}).lean().exec();

    // Summary calculation by state
    const total = subs.length;
    const byState = subs.reduce((acc, s) => {
      const st = s.state || "Unknown";
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {});
    const countsSummary = [`Total Submittals: ${total}`]
      .concat(Object.entries(byState).map(([st, c]) => `${st}: ${c}`))
      .join(" | ");

    // Detailed data
    const details = subs.map(s => (
      `ID: ${s.identifier || "N/A"}
Title: ${s.title || "N/A"}
State: ${s.state || "N/A"}
Priority: ${s.priority || "N/A"}
Submitted By: ${s.submittedBy || "N/A"}
Due Date: ${s.dueDate ? new Date(s.dueDate).toLocaleDateString() : "N/A"}`
    )).join("\n---\n");

    const prompt = `
You are a virtual assistant specialized in managing submittals for a construction project.
Use ONLY the data provided below.

SUMMARY:
${countsSummary}

DETAILED SUBMITTALS DATA:
--- SUBMITTALS DATA START ---
${details}
--- SUBMITTALS DATA END ---

INSTRUCTIONS:
- Use the SUMMARY to answer count or state-related questions.
- Use the DETAILED DATA for specific submittal queries.
- Refer to submittals by their ID when possible.
- If something isn’t in the data, say you don’t have that information.

QUESTION: ${message}
`.trim();

    const result = await genAI
      .getGenerativeModel({ model: "gemini-1.5-flash-latest" })
      .generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      });
    const reply = (await result.response).text().trim();
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
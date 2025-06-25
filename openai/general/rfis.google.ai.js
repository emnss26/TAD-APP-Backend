const env = require('../../config/index.js');
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const getDb  = require("../../config/Mongo_DB_Database/mongodb.js");
const rfiSchema = require("../../resources/schemas/rfis.schema.js");
const { sanitize } = require("../../libs/utils/sanitaze.db.js");

const genAI = new GoogleGenerativeAI(env.GOOGLE_API_KEY);
const router = express.Router();

router.post("/rfis", async (req, res) => {
  const { message, accountId, projectId } = req.body;
  if (!message || !accountId || !projectId) {
    return res.status(400).json({ data: null, error: 'Missing required fields', message: 'Missing required fields' });
  }

  if (!process.env.GOOGLE_API_KEY) {
    return res.status(500).json({ data: null, error: 'Google API key not set', message: 'Google API key not set' });

  }

  try {
    const db = await getDb();
    const projId = projectId.startsWith("b.") ? projectId.substring(2) : projectId;
    const coll = `${sanitize(accountId)}_${sanitize(projId)}_rfis`;
    const Rfis = db.model("Rfis", rfiSchema, coll);
    const rfis = await Rfis.find({}).lean().exec();

    // Summary calculation
    const total = rfis.length;
    const open = rfis.filter(r => r.status === "open").length;
    const closed = rfis.filter(r => r.status === "closed").length;
    const answered = rfis.filter(r => r.status === "answered").length;
    const countsSummary = [
      `Total RFIs: ${total}`,
      `Open: ${open}`,
      `Closed: ${closed}`,
      `Answered: ${answered}`
    ].join(" | ");

    // Detailed data
    const details = rfis.map(rfi => (
      `RFI ID: ${rfi.customIdentifier || "N/A"}
Title: ${rfi.title || "N/A"}
Discipline: ${Array.isArray(rfi.discipline)?rfi.discipline.join(", "):rfi.discipline||"N/A"}
Status: ${rfi.status || "N/A"}
Priority: ${rfi.priority || "N/A"}
Assigned To: ${rfi.assignedTo || "N/A"}
Question: ${rfi.question || "N/A"}
Official Response: ${rfi.officialResponse || "N/A"}
Created By: ${rfi.createdBy || "N/A"}
Responded By: ${rfi.respondedBy || "N/A"} on ${rfi.respondedAt ? new Date(rfi.respondedAt).toLocaleDateString() : "N/A"}`
    )).join("\n---\n");

    // Prompt optimizado
    const prompt = `
You are a virtual assistant specialized in managing Request for Information (RFI) data for a construction project.
Use ONLY the data provided below.

SUMMARY:
${countsSummary}

DETAILED RFI DATA:
--- RFI DATA START ---
${details}
--- RFI DATA END ---

INSTRUCTIONS:
- Use the SUMMARY to answer count-related questions.
- Use the DETAILED DATA for specific RFI queries.
- Refer to RFIs by their ID when possible.
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
    res.json({ data: { reply }, error: null, message: null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ data: null, error: 'Internal server error', message: 'Internal server error' });
  }
});

module.exports = router;
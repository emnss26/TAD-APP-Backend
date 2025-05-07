const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getDb } = require("../../config/mongodb.js");
const modelSchema = require("../../resources/schemas/model.schema.js");
const { sanitize } = require("../../libs/utils/sanitaze.db.js");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const router = express.Router();

router.post("/model-da", async (req, res) => {
  const { message, accountId, projectId } = req.body;
  if (!message || !accountId || !projectId) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (!process.env.GOOGLE_API_KEY) {
    return res.status(500).json({ error: "Google API key not set" });
  }

  try {
    const db = getDb();
    const projId = projectId.startsWith("b.") ? projectId.substring(2) : projectId;
    const coll = `${sanitize(accountId)}_${sanitize(projId)}_models`;
    const Models = db.model("Models", modelSchema, coll);
    const models = await Models.find({}).lean().exec();

    // Cálculo de resumen por disciplina
    const total = models.length;
    const byDiscipline = models.reduce((acc, m) => {
      const d = m.Discipline || "Unknown";
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});
    const countsSummary = [`Total Models: ${total}`]
      .concat(Object.entries(byDiscipline).map(([d, c]) => `${d}: ${c}`))
      .join(" | ");

    // Datos detallados
    const details = models.map(m => (
      `Model ID: ${m.dbId || "N/A"}
Type Name: ${m.TypeName || "N/A"}
Discipline: ${m.Discipline || "N/A"}
Dimensions (L×W×H): ${m.Length||"-"}×${m.Width||"-"}×${m.Height||"-"}
Volume: ${m.Volume||"-"} ${m.Unit||""}
Total Cost: ${m.TotalCost||"N/A"}`
    )).join("\n---\n");

    const prompt = `
You are a virtual assistant specialized in managing building model database entries.
Use ONLY the data provided below.

SUMMARY:
${countsSummary}

DETAILED MODEL DATA:
--- MODEL DATA START ---
${details}
--- MODEL DATA END ---

INSTRUCTIONS:
- Use the SUMMARY to answer count or discipline-related questions.
- Use the DETAILED DATA for specific model queries.
- Refer to models by their ID when possible.
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
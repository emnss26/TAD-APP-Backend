
const express = require('express');
const {GoogleGenerativeAI} = require('@google/generative-ai');
const getDb  = require("../../config/mongodb.js");
const modeldatabaseSchema = require('../../resources/schemas/model.schema.js');
const {sanitize} = require('../../libs/utils/sanitaze.db.js');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const router = express.Router();

async function buildModelDataContext(accountId, projectId) {
  const db = await getDb();
  const safeAcc = sanitize(accountId);
  const safeProj = sanitize(projectId.replace(/^b\./, ""));
  const collName = `${safeAcc}_${safeProj}_modeldatabase`;
  const ModelDB = db.model("ModelDatabase", modeldatabaseSchema, collName);
  const records = await ModelDB.find().lean();
  const summary = records.slice(0, 50).map(r => `${r.dbId}: ${r.TypeName || r.ElementType || "N/A"}`).join("; ");
  return { full: records, summary };
}

async function handleAIRequest(req, res, mode) {
  const { message, accountId, projectId, contextData } = req.body;

  if (!message || !accountId || !projectId) {
    return res.status(400).json({ data: null, error: 'Missing required fields', message: 'Missing required fields' });
  }
  if (!process.env.GOOGLE_API_KEY) {
    return res.status(500).json({ data: null, error: 'Google API key not set', message: 'Google API key not set' });
  }

   try {
    const { full: records, summary } = contextData
      ? { full: contextData, summary: contextData.map(r=>r.dbId).join(",") }
      : await buildModelDataContext(accountId, projectId);

      const formatRecord = r => Object.entries(r)
      .map(([k,v])=>`${k}: ${v}`)
      .join(", ");
    const formattedData = records.slice(0,100).map(formatRecord).join("\n---\n");

    console.log("Model context data:", contextData)
    
    let promptIntro;
    switch(mode) {
      case 'dbid':
        promptIntro = `You are analyzing one model element. Answer based on the element's properties.`;
        break;
      case 'update':
        promptIntro = `You are assisting to update a field of a model element. Reply with JSON: { dbIds: [...], action: 'update', field: 'FieldName', value: 'NewValue' and optional discipline for refresh }`;
        break;
      case 'viewer':
        promptIntro = `You are issuing viewer commands: isolate, hide, or highlight. Reply with JSON { action: 'isolate'|'hide'|'highlight', dbIds: [...] }.`;
        break;
      case 'daterange':
        promptIntro = `You are computing construction date ranges. Describe earliest and latest plan dates.`;
        break;
      default:
        promptIntro = `You are a virtual assistant that answers questions about model data.`;
    }

    const fullPrompt = `${promptIntro}
Here is a brief summary of available elements:
${summary}

Detailed data (first 100 records):
${formattedData}

Question: ${message}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const genConfig = { temperature: 0.2 };
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: fullPrompt }] }], generationConfig: genConfig });
    const reply = result.response.candidates[0].content.parts[0].text.trim();

    // Try to parse JSON for update/viewer commands
    let payload;
    try { payload = JSON.parse(reply); } catch(e) { payload = null; }

    res.json({ data: { reply, ...(payload || {}) }, error: null, message: null });
  } catch (err) {
    console.error("Error in AI modeldata:", err);
    res.status(500).json({ data: null, error: err.message, message: 'Internal server error' });
  }
}

// Routes
router.post('/', (req, res) => handleAIRequest(req, res, 'general'));
router.post('/dbid-question', (req, res) => handleAIRequest(req, res, 'dbid'));
router.post('/update-field', (req, res) => handleAIRequest(req, res, 'update'));
router.post('/autodesk-command', (req, res) => handleAIRequest(req, res, 'viewer'));
router.post('/date-range', (req, res) => handleAIRequest(req, res, 'daterange'));

module.exports = router;
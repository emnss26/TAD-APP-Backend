const modeldatabaseSchema = require("../../resources/schemas/model.schema");
const getDb  = require("../../config/mongodb");
const { validateModelData } = require("../../config/database.schema");

function getCollName(accountId, projectId) {
  const acc  = accountId.replace(/[^a-zA-Z0-9]/g, "_");
  const proj = projectId.replace(/^b\./, "").replace(/[^a-zA-Z0-9]/g, "_");
  return `${acc}_${proj}_modeldatabase`;
}

async function postDataModel(req, res) {
  const { projectId, accountId } = req.params;
  const rows = Array.isArray(req.body) ? req.body : []; 

  
  const docs = rows
    .filter(r => r && r.dbId && String(r.dbId).trim()) 
    .map((r, i) => {
      const doc = { ...r, dbId: String(r.dbId) };
      Object.keys(doc).forEach(k => (doc[k] === null || doc[k] === undefined) && delete doc[k]); 
      if (!validateModelData(doc)) {
        console.warn(`Row ${i} invalid in batch:`, validateModelData.errors);
        return null;
      }
      return doc;
    })
    .filter(Boolean);

  if (!docs.length) {
    
    return res.status(400).json({
      data: [],
      error: "No valid rows in the received batch.",
      message: "The batch sent did not contain valid elements with dbId."
    });
  }

  try {

    const db = await getDb(); 
    const collName = getCollName(accountId, projectId);
    const ModelDB = db.model("ModelDatabase", modeldatabaseSchema, collName);

    const ops = docs.map(doc => ({
      updateOne: {
        filter: { dbId: doc.dbId },
        update: { $set: doc }, 
        upsert: true
      }
    }));
    
    const result = await ModelDB.bulkWrite(ops, { ordered: false });
    
    return res.status(200).json({
    
      data: { 
        processed: docs.length,
        upserted: result.upsertedCount,
        modified: result.modifiedCount
      },
      error: null,
        message: `Processed ${docs.length} documents from the batch.`
    });

  } catch (err) {
      console.error("Error in postDataModel:", err);

    return res.status(500).json({
      data: null,
      error: err.message,
        message: "Internal server error while saving/updating batch data."
    });
  }
}

async function getDataModel(req, res) {
  const { accountId, projectId } = req.params;
  const { discipline } = req.query;

  const db       = await getDb();
  const collName = getCollName(accountId, projectId);
  const ModelDB  = db.model("ModelDatabase", modeldatabaseSchema, collName);

  try {
    const filter = {};
    if (discipline && discipline !== "All Disciplines") {
      filter.Discipline = discipline;
    }
    const items = await ModelDB.find(filter).lean();
    return res.status(200).json({
      data: items,
      error: null,
      message: "Data retrieved successfully"
    });
  } catch (err) {
    console.error("Error in getDataModel:", err);
    return res.status(500).json({
      data: null,
      error: err.message,
        message: "Could not retrieve the data"
    });
  }
}

async function patchDataModel(req, res) {
  const { accountId, projectId, dbId } = req.params;
  const { field, value } = req.body;

  if (!field || value === undefined) {
      return res.status(400).json({
        data: null,
        error: "Missing 'field' or 'value'",
        message: "Provide field and value"
    });
  }

  const db       = await getDb();
  const collName = getCollName(accountId, projectId);
  const ModelDB  = db.model("ModelDatabase", modeldatabaseSchema, collName);

  if (!ModelDB.schema.path(field)) {
    return res.status(400).json({
      data: null,
        error: `Field '${field}' does not exist`,
        message: "Invalid field"
    });
  }

  try {
    const result = await ModelDB.updateOne(
      { dbId: String(dbId) },
      { $set: { [field]: value } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        data: null,
        error: null,
          message: `dbId ${dbId} not found or unchanged`
      });
    }

    return res.status(200).json({
      data: null,
      error: null,
        message: `Field '${field}' updated successfully`
    });
  } catch (err) {
      console.error("Error in patchDataModel:", err);
    return res.status(500).json({
      data: null,
      error: err.message,
        message: "Error updating the document"
    });
  }
}

module.exports = {
  postDataModel,
  getDataModel,
  patchDataModel
};
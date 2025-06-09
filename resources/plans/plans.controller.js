const mongoose = require("mongoose");
const  getDb  = require("../../config/mongodb");
const { validatePlansData } = require("../../config/database.schema");

// Define a Mongoose schema for plans
const plansSchema = new mongoose.Schema(
  {
    _key: { type: String, required: true, index: true, unique: true },
    accountId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    Id: { type: String, required: true },
    SheetName: { type: String },
    SheetNumber: { type: String },
    Discipline: { type: String },
    Revision: { type: String },
    LastModifiedDate: { type: String },
    InFolder: Boolean,
    InARevisionProcess: { type: String },
    RevisionStatus: { type: String },
  },
  { timestamps: false }
);

// Ensure combination of projectId and SheetNumber is unique
plansSchema.index({ projectId: 1, SheetNumber: 1 }, { unique: true });

function getCollName(accountId, projectId) {
  const acc = accountId.replace(/[^a-zA-Z0-9]/g, "_");
  const proj = projectId.replace(/^b\./, "").replace(/[^a-zA-Z0-9]/g, "_");
  return `${acc}_${proj}_plansdatabase`;
}

async function postDataModel(req, res) {
  const { projectId, accountId } = req.params;
  const rows = Array.isArray(req.body) ? req.body : [];

  // Filter only rows with a valid SheetNumber
    const candidates = rows.filter(r => r.SheetNumber && String(r.SheetNumber).trim());
    if (!candidates.length) {
      return res.status(400).json({
        data: [],
        error: "No rows with a valid SheetNumber",
        message: "Add at least one item with a SheetNumber",
      });
  }

  // Validate fields against schema
  const validatedRows = candidates
    .map((r, i) => {
      const rowDoc = {
        Id: String(r.Id),
        SheetName: r.SheetName,
        SheetNumber: r.SheetNumber,
        Discipline: r.Discipline,
        Revision: r.Revision,
        LastModifiedDate: r.LastModifiedDate,
        InFolder:         Boolean(r.InFolder),
        InARevisionProcess: r.InARevisionProcess,
        RevisionStatus: r.RevisionStatus,
        
      };
      // Remove null or undefined
      Object.keys(rowDoc).forEach(key => rowDoc[key] == null && delete rowDoc[key]);

      if (!validatePlansData(rowDoc)) {
        console.warn(`Row ${i} invalid (SheetNumber: ${r.SheetNumber}):`, validatePlansData.errors);
        return null;
      }
      return rowDoc;
    })
    .filter(Boolean);

  if (!validatedRows.length) {
      return res.status(400).json({
        data: [],
        error: "No rows passed validation",
        message: "Check your data format or the backend validation errors.",
      });
  }

  // Map to documents with composite keys
  const docs = validatedRows.map(r => ({
    _key: String(r.SheetNumber),
    accountId,
    projectId,
    ...r,
  }));

  const db = await getDb();
  const collName = getCollName(accountId, projectId);
  const PlansModel = db.model("PlansDatabase", plansSchema, collName);

  try {
    const ops = docs.map(doc => ({
      updateOne: {
        filter: { _key: doc._key },
        update: { $set: doc },
        upsert: true,
      },
    }));
    await PlansModel.bulkWrite(ops, { ordered: false });

    return res.status(200).json({
      data: docs,
      error: null,
        message: `Processed ${docs.length} documents successfully.`,
    });
  } catch (err) {
    console.error("Error en postDataModel (plans):", err);
    return res.status(500).json({
      data: null,
      error: err.message || String(err),
        message: "Error saving/updating the data.",
    });
  }
}

async function getDataModel(req, res) {
  const { projectId, accountId } = req.params;
  const { discipline } = req.query;

  const db = await getDb();
  const collName = getCollName(accountId, projectId);
  const PlansModel = db.model("PlansDatabase", plansSchema, collName);

  try {
    const filter = {};
    if (discipline && discipline.toLowerCase() !== "all disciplines") {
      filter.Discipline = discipline;
    }
    const items = await PlansModel.find(filter).lean();

    //console.log("Recuperados (plans):", items);
    return res.status(200).json({
      data: items,
      error: null,
        message: "Data retrieved successfully",
    });
  } catch (err) {
      console.error("Error in getDataModel (plans):", err);
    return res.status(500).json({
      data: null,
      error: err.message,
        message: "Could not retrieve the data",
    });
  }
}

async function patchDataModel(req, res) {
  const { projectId, accountId, Id } = req.params;
  const { field, value } = req.body;

  if (!field || value === undefined) {
    return res.status(400).json({
      data: null,
        error: "Missing 'field' or 'value'",
        message: "Provide field and value to update",
    });
  }

  const db = await getDb();
  const collName = getCollName(accountId, projectId);
  const PlansModel = db.model("PlansDatabase", plansSchema, collName);

  if (!PlansModel.schema.path(field)) {
    return res.status(400).json({
      data: null,
        error: `Field '${field}' does not exist in the schema`,
        message: "Invalid field",
    });
  }

  try {
    const result = await PlansModel.updateOne(
      { _key: String(Id) },
      { $set: { [field]: value } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        data: null,
        error: null,
          message: `No item with Id ${Id} found or value unchanged`,
      });
    }

    return res.status(200).json({
      data: null,
      error: null,
        message: `Field '${field}' updated successfully`,
    });
  } catch (err) {
      console.error("Error in patchDataModel (plans):", err);
    return res.status(500).json({
      data: null,
      error: err.message,
        message: "Error updating the document",
    });
  }
}

async function deleteDataModel(req, res) {
  const { accountId, projectId } = req.params;
  const { ids } = req.body;           // array of SheetNumber (_key) to delete

  if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({
        data: null,
        error: "Missing ids",
        message: "Send an 'ids' array with the SheetNumbers to delete"
    });
  }

  const db        = await getDb();
  const PlansModel = db.model(
    "PlansDatabase",
    plansSchema,
    getCollName(accountId, projectId)
  );

  try {
    const result = await PlansModel.deleteMany({ _key: { $in: ids.map(String) } });
    return res.status(200).json({
      data: { deleted: result.deletedCount },
      error: null,
        message: `Deleted ${result.deletedCount} documents`
    });
  } catch (err) {
      console.error("Error in deleteDataModel (plans):", err);
    return res.status(500).json({
      data: null,
      error: err.message,
        message: "Error deleting documents"
    });
  }
}


module.exports = {
  postDataModel,
  getDataModel,
  patchDataModel,
  deleteDataModel,
};

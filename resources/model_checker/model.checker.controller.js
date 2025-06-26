const mongoose = require("mongoose");
const  getDb  = require("../../config/Mongo_DB_Database/mongodb");
const { sanitize } = require("../../libs/utils/sanitaze.db");

const modelCheckerSchema = new mongoose.Schema(
  {
    _key:        { type: String, required: true, index: true, unique: true },
    accountId:   { type: String, required: true, index: true },
    projectId:   { type: String, required: true, index: true },
    id:          { type: String, required: true },
    row:        { type: Number, required: true }, 
    concept:     { type: String, required: true },
    req_lod:     { type: String, required: true },
    complet_geometry: { type: String, required: true },
    lod_compliance:   { type: String, required: true },
    comments:    { type: String, required: true },
    lastModifiedDate: { type: Date, default: Date.now },
  },
  { timestamps: false }
);
modelCheckerSchema.index({ projectId: 1, concept: 1 }, { unique: true });

/** Construye el nombre de colección basado en disciplina */
function getCollectionName(accountId, projectId, discipline) {
  const safeAcc  = sanitize(accountId);
  const safeProj = sanitize(projectId);
  const safeDisc = sanitize(discipline.toLowerCase().replace(/\s+/g, "-"));
  return `${safeAcc}_${safeProj}_lod-checker-${safeDisc}`;
}

/** Crea/reusa el modelo mongoose para la colección dada */
function getModel(accountId, projectId, discipline) {
  const collName = getCollectionName(accountId, projectId, discipline);
  // El primer arg “ModelChecker” es un identificador de modelo interno
  return getDb().then(() =>
    mongoose.model("ModelChecker", modelCheckerSchema, collName)
  );
}

// POST /:acc/:proj/model-checker
exports.postDataModel = async (req, res) => {
  try {
    const { accountId, projectId } = req.params;
    const { discipline, concept, "req_lod": req_lod, "complet_geometry": complet_geometry, "lod_compliance": lod_compliance, comments, row } = req.body;
    const Model = await getModel(accountId, projectId, discipline);

    // _key: único por proyecto+disciplina+concepto
    const key = `${projectId}-${discipline}-${concept}`;

    await Model.updateOne(
      { _key: key },
      {
        $set: {
          _key: key,
          accountId, projectId,
          id: key,
          concept,
          req_lod,
          complet_geometry,
          lod_compliance,
          comments,
          row,
        },
      },
      { upsert: true }
    );

    res.status(200).json({
      data: { _key: key },
      error: null,
      message: "Model‐checker entry saved",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ data: null, error: err.message, message: "Error saving data" });
  }
};

// GET /:acc/:proj/model-checker/:discipline
// GET /:acc/:proj/model-checker
exports.getDataModel = async (req, res) => {
  try {
    const { accountId, projectId, discipline } = req.params;
    if (!discipline) {
      return res.status(400).json({ data: null, error: "Discipline required", message: "" });
    }
    const Model = await getModel(accountId, projectId, discipline);
    const docs = await Model.find().lean();
    res.status(200).json({ data: docs, error: null, message: "Fetched entries" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ data: null, error: err.message, message: "Error fetching data" });
  }
};

// PATCH /:acc/:proj/model-checker/:discipline
exports.patchDataModel = async (req, res) => {
  try {
    const { accountId, projectId, discipline } = req.params;
    const { concept, "req-lod": req_lod, "complet-geometry": complet_geometry, "lod-compliance": lod_compliance, comments, row } = req.body;
    const Model = await getModel(accountId, projectId, discipline);

    const key = `${projectId}-${discipline}-${concept}`;

    const result = await Model.updateOne(
      { _key: key },
      {
        $set: {
          req_lod,
          complet_geometry,
          lod_compliance,
          comments,
          lastModifiedDate: Date.now(),
          row,
        },
      }
    );
    res.status(200).json({ data: result, error: null, message: "Entry updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ data: null, error: err.message, message: "Error updating data" });
  }
};

// DELETE /:acc/:proj/model-checker/:discipline
exports.deleteDataModel = async (req, res) => {
  try {
    const { accountId, projectId, discipline } = req.params;
    const Model = await getModel(accountId, projectId, discipline);
    await Model.deleteMany({});
    res.status(200).json({ data: null, error: null, message: "All entries deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ data: null, error: err.message, message: "Error deleting data" });
  }
};

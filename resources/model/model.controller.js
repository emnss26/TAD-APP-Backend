const { default: axios } = require("axios");

const modeldatabaseSchema = require("../../resources/schemas/model.schema");
const { getDb } = require("../../config/mongodb");
const { validateModelData } = require("../../config/database.schema");

function getCollName(accountId, projectId) {
  const acc = accountId.replace(/[^a-zA-Z0-9]/g, "_");
  const proj = projectId.replace(/^b\./, "").replace(/[^a-zA-Z0-9]/g, "_");
  return `${acc}_${proj}_modeldatabase`;
}

async function postDataModel(req, res) {
  const { projectId, accountId } = req.params;
  const rows = Array.isArray(req.body) ? req.body : [];

  const candidates = rows.filter((r) => r.dbId && String(r.dbId).trim());
  if (!candidates.length) {
    return res.status(400).json({
      data: [],
      error: "No hay filas con dbId válido",
      message: "Añade al menos un elemento con dbId",
    });
  }

  const docs = candidates
    .map((r, i) => {
      const doc = { ...r, dbId: String(r.dbId) };
      Object.keys(doc).forEach((k) => doc[k] == null && delete doc[k]);
      if (!validateModelData(doc)) {
        console.warn(`Fila ${i} inválida:`, validateModelData.errors);
        return null;
      }
      return doc;
    })
    .filter(Boolean);

  if (!docs.length) {
    return res.status(400).json({
      data: [],
      error: "Ninguna fila pasó la validación",
      message: "Revisa el formato en la consola del backend",
    });
  }

  const db = getDb(accountId, projectId);
  const collName = getCollName(accountId, projectId);
  const ModelDB = db.model("ModelDatabase", modeldatabaseSchema, collName);

  try {
    const ops = docs.map((doc) => ({
      updateOne: {
        filter: { dbId: doc.dbId },
        update: { $set: doc },
        upsert: true,
      },
    }));
    await ModelDB.bulkWrite(ops, { ordered: false });

    res.status(200).json({
      data: docs,
      error: null,
      message: `Procesados ${docs.length} documentos correctamente.`,
    });
  } catch (err) {
    console.error("Error en postDataModel:", err);
    res.status(500).json({
      data: null,
      error: err.message,
      message: "Error al guardar/actualizar los datos.",
    });
  }
}

async function getDataModel(req, res) {
  const { accountId, projectId } = req.params;
  const { discipline } = req.query;

  const db = getDb(accountId, projectId);
  const collName = getCollName(accountId, projectId);
  const ModelDB = db.model("ModelDatabase", modeldatabaseSchema, collName);

  try {
    const filter = {};
    if (discipline && discipline !== "All Disciplines") {
      filter.Discipline = discipline;
    }

    const items = await ModelDB.find(filter).lean();

    //console.log("items:", items);

    res.status(200).json({
      data: items,
      error: null,
      message: "Datos recuperados correctamente",
    });
  } catch (err) {
    console.error("Error en getDataModel:", err);
    res.status(500).json({
      data: null,
      error: err.message,
      message: "No se pudieron recuperar los datos",
    });
  }
}

async function patchDataModel(req, res) {
  const { accountId, projectId, dbId } = req.params;
  const { field, value } = req.body;

  if (!field || value === undefined) {
    return res.status(400).json({
      data: null,
      error: "Faltan 'field' o 'value'",
      message: "Proporciona field y value para actualizar",
    });
  }

  const db = getDb(accountId, projectId);
  const collName = getCollName(accountId, projectId);
  const ModelDB = db.model("ModelDatabase", modeldatabaseSchema, collName);

  if (!ModelDB.schema.path(field)) {
    return res.status(400).json({
      data: null,
      error: `El campo '${field}' no existe en el esquema`,
      message: "Campo inválido",
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
        message: `No se encontró elemento con dbId ${dbId} o no cambió valor`,
      });
    }

    res.status(200).json({
      data: null,
      error: null,
      message: `Campo '${field}' actualizado correctamente`,
    });
  } catch (err) {
    console.error("Error en patchDataModel:", err);
    res.status(500).json({
      data: null,
      error: err.message,
      message: "Error al actualizar el documento",
    });
  }
}

module.exports = {
  postDataModel,
  getDataModel,
  patchDataModel,
};

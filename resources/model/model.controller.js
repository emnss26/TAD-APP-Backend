const { default: axios } = require("axios");

const { format } = require("morgan");

const { insertDocs, upsertDoc, getDocs } = require("../../config/database");

const { validateModelData } = require("../../config/database.schema");

function getCollName(accountId, projectId) {
  return `${accountId}_${projectId}_modeldatabase`;
}

async function postDataModel(req, res) {
  const { projectId, accountId } = req.params;
  const rows = Array.isArray(req.body) ? req.body : [];

  const nonEmpty = rows.filter(r => r.dbId && String(r.dbId).trim());
  if (!nonEmpty.length) {
    return res.status(400).json({ /* …mensaje… */ });
  }

  const docs = [];
  nonEmpty.forEach((r, i) => {
    const doc = { accountId, projectId, ...r };
    if (!validateModelData(doc)) {
      console.warn(`Fila ${i} inválida:`, validateModelData.errors);
    } else {
      docs.push(doc);
    }
  });
  if (!docs.length) {
    return res.status(400).json({ /* …mensaje… */ });
  }

  const coll = getCollName(accountId, projectId);
  try {
    // CORRECCIÓN: mapear el array a promesas
    await Promise.all(
      docs.map(doc => upsertDoc(coll, doc.dbId, doc))
    );
    res.status(200).json({ data: docs, error: null, message: "Guardado OK" });
  } catch (err) {
    console.error("Error en upsert bulk:", err);
    res.status(500).json({ /* …mensaje de error… */ });
  }
}

async function getDataModel(req, res) {
  const { projectId, accountId } = req.params;
  const { discipline, page = 1, limit = 5000 } = req.query;
  const coll = getCollName(accountId, projectId);

  // 1) Construir parámetros SODA
  const q = [];
  if (discipline && discipline.toLowerCase() !== "all disciplines") {
    q.push(`filter=discipline eq '${encodeURIComponent(discipline)}'`);
  }
  q.push(`limit=${parseInt(limit, 10)}`);
  q.push(`offset=${(page - 1) * parseInt(limit, 10)}`);

  try {
    // 2) Llamada a SODA
    const items = await getDocs(`${coll}?${q.join("&")}`);
    res.status(200).json({
      data: items,
      error: null,
      message: "Datos recuperados correctamente",
    });
  } catch (err) {
    console.error("Error al obtener docs:", err);
    res.status(500).json({
      data: null,
      error: err.message,
      message: "No se pudieron recuperar los datos",
    });
  }
}

async function patchDataModel(req, res) {
  const { projectId, accountId, dbId } = req.params;
  const { field, value } = req.body;
  const coll = getCollName(accountId, projectId);

  if (!field || value === undefined) {
    return res.status(400).json({
      data: null,
      error: "Faltan 'field' o 'value'",
      message: "Proporciona field y value para actualizar",
    });
  }

  try {
    // 1) Recuperar el doc existente
    const [existing] = await getDocs(
      `${coll}?filter=dbId eq '${encodeURIComponent(dbId)}'`
    );
    if (!existing) {
      return res.status(404).json({
        data: null,
        error: "No encontrado",
        message: `No existe modelo con dbId ${dbId}`,
      });
    }

    // 2) Actualizar el campo
    const updatedDoc = { ...existing, [field]: value };

    // 3) Validar contra el esquema completo
    if (!validateModelData(updatedDoc)) {
      return res.status(400).json({
        data: null,
        error: "Validación fallida",
        message: validateModelData.errors,
      });
    }

    // 4) Upsert del documento completo
    await upsertDoc(coll, dbId, updatedDoc);

    return res.status(200).json({
      data: updatedDoc,
      error: null,
      message: `Campo '${field}' actualizado correctamente`,
    });
  } catch (err) {
    console.error("Error en patchDataModel:", err);
    return res.status(500).json({
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

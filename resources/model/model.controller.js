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

  // 1. Filtrar filas con dbId inválido
  const nonEmpty = rows.filter((r) => r.dbId && String(r.dbId).trim());
  if (!nonEmpty.length) {
    return res.status(400).json({
      data: [],
      error: "No hay filas con dbId válido",
      message: "Proporciona al menos una fila con dbId",
    });
  }

  const docs = [];
  nonEmpty.forEach((r, i) => {
    const doc = { accountId, projectId, ...r };
    if (!validateModelData(doc)) {
      console.warn(
        `Fila ${i} inválida (dbId=${r.dbId}):`,
        validateModelData.errors
      );
    } else {
      docs.push(doc);
    }
  });
  if (!docs.length) {
    return res.status(400).json({
      data: [],
      error: "Todos los docs fallaron validación",
      message: "Revisa formato de tus datos",
    });
  }

  const coll = getCollName(accountId, projectId);
  try {
    await Promise.all(docs.map((doc) => upsertDoc(coll, doc.dbId, doc)));
    res.status(200).json({
      data: docs,
      error: null,
      message: "Datos guardados/upsert correctamente",
    });
  } catch (err) {
    console.error("Error en upsert bulk:", err);
    res.status(500).json({
      data: null,
      error: err.message,
      message: "No se pudieron guardar los datos",
    });
  }
}

async function getDataModel(req, res) {
  const { projectId, accountId } = req.params;
  const { discipline, page = 1, limit = 5000 } = req.query;
  const coll = getCollName(accountId, projectId);

  const q = [];
  if (discipline && discipline.toLowerCase() !== "all disciplines") {
    q.push(`filter=discipline eq '${encodeURIComponent(discipline)}'`);
  }
  q.push(`limit=${parseInt(limit, 10)}`);
  q.push(`offset=${(page - 1) * parseInt(limit, 10)}`);

  try {
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

    const updatedDoc = { ...existing, [field]: value };

    if (!validateModelData(updatedDoc)) {
      return res.status(400).json({
        data: null,
        error: "Validación fallida",
        message: validateModelData.errors,
      });
    }

    await upsertDoc(coll, dbId, updatedDoc);

    res.status(200).json({
      data: updatedDoc,
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

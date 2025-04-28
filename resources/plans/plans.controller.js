const { default: axios } = require("axios");

const { format } = require("morgan");

const { insertDocs, upsertDoc, getDocs } = require("../../config/database");

const { validatePlansData } = require("../../config/database.schema");
const ORDS_URL = process.env.ORDS_URL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const basicAuth = Buffer.from(`ADMIN:${ADMIN_PASSWORD}`).toString("base64");

const client = axios.create({
  baseURL: ORDS_URL,
  headers: {
    Authorization: `Basic ${basicAuth}`,
    "Content-Type": "application/json",
  },
  timeout: 5000,
});

const SCHEMA = process.env.ORDS_SCHEMA || "admin";

function getCollName(accountId, projectId) {
  return `${accountId}_${projectId}_plansdatabase`;
}

async function postDataModel(req, res) {
  const { projectId, accountId } = req.params;
  const rows = Array.isArray(req.body) ? req.body : [];

  // 1) Filtrar filas que tengan un SheetNumber válido
  const candidates = rows.filter(r => r.SheetNumber && String(r.SheetNumber).trim());
  if (!candidates.length) {
    return res.status(400).json({
      data: [],
      error: "No hay filas con SheetNumber válido",
      message: "Añade al menos un elemento con SheetNumber",
    });
  }

  // 2) Validar solo los campos permitidos
  const validatedRows = candidates
    .map((r, i) => {
      const rowDoc = {
        Id: r.Id,
        SheetName: r.SheetName,
        SheetNumber: r.SheetNumber,
        Discipline: r.Discipline,
        Revision: r.Revision,
        RevisionDate: r.RevisionDate,
      };
      // Quitar campos nulos antes de validar
      Object.keys(rowDoc).forEach(key => rowDoc[key] == null && delete rowDoc[key]);

      if (!validatePlansData(rowDoc)) {
        console.warn(`Fila ${i} inválida (SheetNumber: ${r.SheetNumber}):`, validatePlansData.errors);
        return null;
      }
      return rowDoc;
    })
    .filter(Boolean);

  if (!validatedRows.length) {
    return res.status(400).json({
      data: [],
      error: "Ninguna fila pasó la validación",
      message: "Revisa el formato de tus datos o los errores en la consola del backend.",
    });
  }

  // 3) Mapear a documentos con clave _key = SheetNumber
  const docs = validatedRows.map(r => ({
    _key: String(r.SheetNumber),
    accountId,
    projectId,
    ...r,
  }));

  const coll = getCollName(accountId, projectId);

  try {
    const results = [];
    for (const doc of docs) {
      // upsertDoc se encargará de insertar o actualizar según exista o no _key
      const result = await upsertDoc(coll, doc._key, doc);
      results.push(result);
    }
    return res.status(200).json({
      data: docs,
      error: null,
      message: `Procesados ${docs.length} documentos correctamente.`,
    });
  } catch (err) {
    console.error("Error en postDataModel:", err);
    return res.status(500).json({
      data: null,
      error: err.message || String(err),
      message: "Error al guardar/actualizar los datos.",
    });
  }
}

async function getDataModel(req, res) {
  const { projectId, accountId } = req.params;
  const { discipline } = req.query;
  const coll = getCollName(accountId, projectId);

  try {
    let items;
    if (discipline && discipline.toLowerCase() !== "all disciplines") {
      
      try {
        const qbe = { Discipline: discipline };
        const url = `/${SCHEMA}/soda/latest/${coll}?action=query`;
        const response = await client.post(url, qbe);
        items = response.data.items;
      } catch (err) {
        
        if (err.response && err.response.status === 404) {
          items = [];
        } else {
          throw err;
        }
      }
    } else {
      
      items = await getDocs(coll);
    }

    console.log("Recuperados", items);

    return res.status(200).json({
      data: items,
      error: null,
      message: "Datos recuperados correctamente",
    });
  } catch (err) {
    console.error("Error al obtener docs:", err);
    return res.status(500).json({
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
    if (!validatePlansData(updatedDoc)) {
      return res.status(400).json({
        data: null,
        error: "Validación fallida",
        message: validatePlansData.errors,
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

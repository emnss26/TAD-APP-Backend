const { default: axios } = require("axios");

const { format } = require("morgan");

const { insertDocs, upsertDoc, getDocs} = require("../../config/database");

const { validateModelData } = require("../../config/database.schema");
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

const SCHEMA = process.env.ORDS_SCHEMA || 'admin';

function getCollName(accountId, projectId) {
  return `${accountId}_${projectId}_modeldatabase`;
}

async function postDataModel(req, res) {
  const { projectId, accountId } = req.params;
  const rows = Array.isArray(req.body) ? req.body : [];

  
  const candidates = rows.filter(r => r.dbId && String(r.dbId).trim());
  if (!candidates.length) {
    return res.status(400).json({
      data: [],
      error: "No hay filas con dbId válido",
      message: "Añade al menos un elemento con dbId"
    });
  }

  
  const validatedRows = candidates.map((r, i) => {
    const rowDoc = {
      
      dbId: r.dbId,
      Code: r.Code,
      Discipline: r.Discipline,
      ElementType: r.ElementType,
      TypeName: r.TypeName,
      Description: r.Description,
      TypeMark: r.TypeMark,
      Length: r.Length,
      Width: r.Width,
      Height: r.Height,
      Perimeter: r.Perimeter,
      Area: r.Area,
      Volume: r.Volume,
      Thickness: r.Thickness,
      Level: r.Level,
      Materials: r.Material, 
      PlanedConstructionStartDate: r.PlanedConstructionStartDate,
      PlanedConstructionEndDate:   r.PlanedConstructionEndDate,
      RealConstructionStartDate:    r.RealConstructionStartDate,
      RealConstructionEndDate:      r.RealConstructionEndDate,
      Unit: r.Unit,
      Quantity: r.Quantity,
      UnitCost: r.UnitCost,
      TotalCost: r.TotalCost,
      EnergyConsumption: r.EnergyConsumption,
      WaterConsumption:  r.WaterConsumption,
      CarbonFootprint:   r.CarbonFootprint,
      LifeCycleStage:    r.LifeCycleStage,
      LEEDcreditCategory: r.LEEDcreditCategory,
      LEEDcredit:         r.LEEDcredit,
      Manufacturer:       r.Manufacturer,
      Model:              r.Model,
      Keynote:            r.Keynote,
      Comments:           r.Comments,
      Warranty:           r.Warranty,
      MaintenancePeriod:  r.MaintenancePeriod,
      MaintenanceSchedule:r.MaintenanceSchedule,
      MaintenanceCost:    r.MaintenanceCost,
      SerialNumber:       r.SerialNumber
    };

    // Elimina propiedades nulas o indefinidas ANTES de validar si tu esquema es estricto
    Object.keys(rowDoc).forEach(key => (rowDoc[key] == null) && delete rowDoc[key]);


    if (!validateModelData(rowDoc)) {
      console.warn(`Fila ${i} (dbId: ${r.dbId}) inválida:`, validateModelData.errors);
      return null;
    }
    return rowDoc;
  }).filter(Boolean);

  if (!validatedRows.length) {
    return res.status(400).json({
      data: [],
      error: "Ninguna fila pasó la validación",
      message: "Revisa el formato de tus datos o los errores de validación en la consola del backend."
    });
  }

  // 3) Ahora sí riqueza final con _key y metadatos
  const docs = validatedRows.map(r => ({
    _key: String(r.dbId), // La clave SODA será el dbId como string
    accountId,
    projectId,
    ...r // Incluye todas las propiedades validadas
  }));

  const coll = getCollName(accountId, projectId); // Usa la función helper

  try {
    
    const results = [];
    // Itera sobre cada documento preparado y llama a upsertDoc
    for (const doc of docs) {
        // console.log(`Intentando upsert para _key: ${doc._key} en colección ${coll}`); // Log para depuración
        const result = await upsertDoc(coll, doc._key, doc);
        results.push(result); // Opcional: guardar resultados si los necesitas
    }

    // Devuelve los documentos originales enviados (o los resultados si prefieres)
    return res.status(200).json({
      // data: results, // Podrías devolver los resultados del upsert si son útiles
      data: docs, // Devuelve los documentos que se intentaron guardar/actualizar
      error: null,
      message: `Procesados ${docs.length} documentos correctamente (actualizados o insertados).` // Mensaje corregido
    });

  } catch (err) {
    console.error("Error en postDataModel durante el bucle de upsert:", err);
    return res.status(500).json({
      data: null,
      error: err.message || String(err),
      message: "Error al guardar/actualizar los datos. Uno o más documentos pudieron fallar."
    });
  }
}

async function getDataModel(req, res) {
  const { projectId, accountId } = req.params;
  const { discipline } = req.query;
  const coll = getCollName(accountId, projectId);

  try {
    let items;
    if (discipline && discipline.toLowerCase() !== 'all disciplines') {
      // POST con Query‐By‐Example
      const qbe = { Discipline: discipline };
      const url = `/${SCHEMA}/soda/latest/${coll}?action=query`;
      const response = await client.post(url, qbe);
      items = response.data.items;
    } else {
      items = await getDocs(coll);
    }

    res.status(200).json({
      data: items,
      error: null,
      message: 'Datos recuperados correctamente'
    });
  } catch (err) {
    console.error('Error al obtener docs:', err);
    res.status(500).json({
      data: null,
      error: err.message,
      message: 'No se pudieron recuperar los datos'
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

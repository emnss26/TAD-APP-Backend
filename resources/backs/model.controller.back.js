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
      error: "No rows with a valid dbId",
      message: "Add at least one element with dbId"
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

  // Remove null or undefined properties BEFORE validating if your schema is strict
    Object.keys(rowDoc).forEach(key => (rowDoc[key] == null) && delete rowDoc[key]);


    if (!validateModelData(rowDoc)) {
      console.warn(`Row ${i} (dbId: ${r.dbId}) invalid:`, validateModelData.errors);
      return null;
    }
    return rowDoc;
  }).filter(Boolean);

  if (!validatedRows.length) {
    return res.status(400).json({
      data: [],
      error: "No rows passed validation",
      message: "Check your data format or backend validation errors."
    });
  }

  // 3) Now enrich with _key and metadata
  const docs = validatedRows.map(r => ({
    _key: String(r.dbId), // The SODA key will be the dbId as string
    accountId,
    projectId,
    ...r // Incluye todas las propiedades validadas
  }));

  const coll = getCollName(accountId, projectId); // Use the helper function

  try {
    
    const results = [];
      // Iterate over each prepared document and call upsertDoc
    for (const doc of docs) {
        // console.log(`Attempting upsert for _key: ${doc._key} in collection ${coll}`); // Debug log
        const result = await upsertDoc(coll, doc._key, doc);
        results.push(result); // Opcional: guardar resultados si los necesitas
    }

      // Return the original documents sent (or the results if you prefer)
    return res.status(200).json({
        // data: results, // You could return the upsert results if useful
        data: docs, // Return the documents that were attempted to be saved/updated
      error: null,
        message: `Processed ${docs.length} documents correctly (updated or inserted).`
    });

  } catch (err) {
    console.error("Error in postDataModel during upsert loop:", err);
    return res.status(500).json({
      data: null,
      error: err.message || String(err),
      message: "Error saving/updating data. One or more documents may have failed."
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
        message: 'Data retrieved successfully'
    });
  } catch (err) {
    console.error('Error getting docs:', err);
    res.status(500).json({
      data: null,
      error: err.message,
      message: 'Could not retrieve the data'
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
        error: "Missing 'field' or 'value'",
        message: "Provide field and value to update",
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
        error: "Not found",
        message: `No model with dbId ${dbId} exists`,
      });
    }

    // 2) Actualizar el campo
    const updatedDoc = { ...existing, [field]: value };

    // 3) Validar contra el esquema completo
    if (!validateModelData(updatedDoc)) {
      return res.status(400).json({
        data: null,
        error: "Validation failed",
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
    console.error("Error in patchDataModel:", err);
    return res.status(500).json({
      data: null,
      error: err.message,
      message: "Error updating the document",
    });
  }
}

module.exports = {
  postDataModel,
  getDataModel,
  patchDataModel,
};

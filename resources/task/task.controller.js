const mongoose = require("mongoose");
const { getDb } = require("../../config/mongodb.js");
const taskSchema = require("../../resources/schemas/task.schema.js");

// Genera el nombre de colección según cuenta y proyecto
function getCollName(accountId, projectId) {
  const acc = accountId.replace(/[^a-zA-Z0-9]/g, "_");
  const proj = projectId.replace(/^b\./, "").replace(/[^a-zA-Z0-9]/g, "_");
  return `${acc}_${proj}_tasks`;
}

// Crear o actualizar en bulk
const createTask = async (req, res) => {
  const { accountId, projectId } = req.params;
  const rows = Array.isArray(req.body)
  ? req.body
  : req.body && typeof req.body === 'object'
  ? [req.body]
  : [];

  // Filtrar filas con id válido
  const candidates = rows.filter(r => r.id && String(r.id).trim());
  if (!candidates.length) {
    return res.status(400).json({
      data: [],
      error: "No hay filas con id válido",
      message: "Añade al menos un elemento con id",
    });
  }

  // Mapear a documentos prontos para Mongo
  const validatedRows = candidates.map((r, i) => {
    const doc = {
      _key: String(r._key || r.id),
      projectId: String(projectId),
      accountId: String(accountId),
      id: String(r.id),
      title: r.title,
      description: r.description,
      status: r.status,
      startDate: r.startDate,
      endDate: r.endDate,
      assignedTo: r.assignedTo,
    };
    // Eliminar valores null/undefined
    Object.keys(doc).forEach(k => doc[k] == null && delete doc[k]);
    return doc;
  }).filter(Boolean);

  if (!validatedRows.length) {
    return res.status(400).json({
      data: [],
      error: "No hay filas válidas",
      message: "Añade al menos un elemento válido",
    });
  }

  const db = getDb();
  const collectionName = getCollName(accountId, projectId);
  // Usar el nombre de colección también como nombre de modelo para evitar colisiones
  const Task = db.model(collectionName, taskSchema, collectionName);

  try {
    const ops = validatedRows.map(doc => ({
      updateOne: {
        filter: { _key: doc._key },
        update: { $set: doc },
        upsert: true,
      }
    }));
    await Task.bulkWrite(ops, { ordered: false });

    return res.status(200).json({
      data: validatedRows,
      error: null,
      message: `Procesados ${validatedRows.length} documentos correctamente.`
    });
  } catch (error) {
    console.error("Error creando tareas:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(v => v.message);
      return res.status(400).json({ error: messages.join(" ") });
    }
    return res.status(500).json({ message: "Error del servidor al crear las tareas." });
  }
};

// Obtener todas las tareas
const getAllTasks = async (req, res) => {
  const { accountId, projectId } = req.params;
  const db = getDb();
  const collectionName = getCollName(accountId, projectId);
  const Task = db.model(collectionName, taskSchema, collectionName);

  try {
    const tasks = await Task.find({});
    return res.json({ data: tasks, error: null, message: "Tareas recuperadas correctamente." });
  } catch (error) {
    console.error("Error obteniendo tareas:", error);
    return res.status(500).json({ message: "Error del servidor al obtener las tareas." });
  }
};

// Actualizar una tarea por su _key
const updateTask = async (req, res) => {
  const { accountId, projectId, id } = req.params;
  const db = getDb();
  const collectionName = getCollName(accountId, projectId);
  const Task = db.model(collectionName, taskSchema, collectionName);

  try {
    const updates = {};
    const fields = ["title", "description", "assignedTo", "status"];
    fields.forEach(f => {
      if (req.body[f] != null) updates[f] = req.body[f];
    });
    if (req.body.startDate)
      updates.startDate = new Date(req.body.startDate + 'T00:00:00');
    if (req.body.endDate)
      updates.endDate   = new Date(req.body.endDate   + 'T00:00:00');

    const task = await Task.findOneAndUpdate(
      { _key: id },
      { $set: updates },
      { new: true }
    );
    if (task) {
      return res.json({ data: task, error: null, message: "Tarea actualizada correctamente." });
    }
    return res.status(404).json({ data: null, error: "Not Found", message: "Tarea no encontrada." });
  } catch (error) {
    console.error("Error actualizando tarea:", error);
    if (error.name === "ValidationError") {
      const msgs = Object.values(error.errors).map(v => v.message);
      return res.status(400).json({ error: msgs.join(" ") });
    }
    return res.status(500).json({ message: "Error del servidor al actualizar la tarea." });
  }
};

// Eliminar una tarea por su _key
const deleteTask = async (req, res) => {
  const { projectId, accountId, id } = req.params;
  const db = getDb();
  const collectionName = getCollName(accountId, projectId);
  const Task = db.model(collectionName, taskSchema, collectionName);

  try {
    const result = await Task.deleteOne({ _key: id });
    if (result.deletedCount > 0) {
      return res.json({ data: null, error: null, message: "Tarea eliminada correctamente." });
    }
    return res.status(404).json({ data: null, error: "Not Found", message: "Tarea no encontrada." });
  } catch (error) {
    console.error("Error eliminando tarea:", error);
    return res.status(500).json({ message: "Error del servidor al eliminar la tarea." });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  updateTask,
  deleteTask,
};

const mongoose = require("mongoose");
const  getDb  = require("../../config/mongodb.js");
const taskSchema = require("../../resources/schemas/task.schema.js");

// Generate the collection name based on account and project
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

  // Filter rows with a valid id
  const candidates = rows.filter(r => r.id && String(r.id).trim());
  if (!candidates.length) {
    return res.status(400).json({
      data: [],
        error: "No rows with a valid id",
        message: "Add at least one item with an id",
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
      // Remove null/undefined values
    Object.keys(doc).forEach(k => doc[k] == null && delete doc[k]);
    return doc;
  }).filter(Boolean);

  if (!validatedRows.length) {
    return res.status(400).json({
      data: [],
        error: "No valid rows",
        message: "Add at least one valid item",
    });
  }

  const db = await getDb();
  const collectionName = getCollName(accountId, projectId);
  // Use the collection name also as the model name to avoid collisions
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
        message: `Processed ${validatedRows.length} documents successfully.`
    });
  } catch (error) {
    console.error("Error creating tasks:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(v => v.message);
      return res.status(400).json({ error: messages.join(" ") });
    }
      return res.status(500).json({ message: "Server error while creating tasks." });
  }
};

// Get all tasks
const getAllTasks = async (req, res) => {
  const { accountId, projectId } = req.params;
  const db = await getDb();
  const collectionName = getCollName(accountId, projectId);
  const Task = db.model(collectionName, taskSchema, collectionName);

  try {
    const tasks = await Task.find({});
      return res.json({ data: tasks, error: null, message: "Tasks retrieved successfully." });
  } catch (error) {
    console.error("Error fetching tasks:", error);
      return res.status(500).json({ message: "Server error while fetching tasks." });
  }
};

// Update a task by its _key
const updateTask = async (req, res) => {
  const { accountId, projectId, id } = req.params;
  const db = await getDb();
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
        return res.json({ data: task, error: null, message: "Task updated successfully." });
    }
      return res.status(404).json({ data: null, error: "Not Found", message: "Task not found." });
  } catch (error) {
    console.error("Error updating task:", error);
    if (error.name === "ValidationError") {
      const msgs = Object.values(error.errors).map(v => v.message);
      return res.status(400).json({ error: msgs.join(" ") });
    }
      return res.status(500).json({ message: "Server error while updating the task." });
  }
};

// Delete a task by its _key
const deleteTask = async (req, res) => {
  const { projectId, accountId, id } = req.params;
  const db = await getDb();
  const collectionName = getCollName(accountId, projectId);
  const Task = db.model(collectionName, taskSchema, collectionName);

  try {
    const result = await Task.deleteOne({ _key: id });
    if (result.deletedCount > 0) {
        return res.json({ data: null, error: null, message: "Task deleted successfully." });
    }
      return res.status(404).json({ data: null, error: "Not Found", message: "Task not found." });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({ message: "Server error while deleting the task." });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  updateTask,
  deleteTask,
};

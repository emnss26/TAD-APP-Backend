// config/database.js
const axios = require("axios");

const ORDS_URL = process.env.ORDS_URL;           // ej. https://.../ords
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ORDS_URL || !ADMIN_PASSWORD) {
  console.error("❌ Define ORDS_URL (sin /admin) y ADMIN_PASSWORD");
  process.exit(1);
}

// Crear cliente Axios con Basic Auth
const basicAuth = Buffer.from(`ADMIN:${ADMIN_PASSWORD}`).toString("base64");
const client = axios.create({
  baseURL: ORDS_URL,
  headers: {
    Authorization: `Basic ${basicAuth}`,
    "Content-Type": "application/json"
  },
  timeout: 5000
});

console.log(`🔌 ORDS client configurado en ${ORDS_URL}`);

// Nombre de tu esquema REST-enabled
const SCHEMA = "admin";

// 1) Asegura que exista la colección (PUT).  
async function ensureCollection(name) {
  try {
    await client.put(`/${SCHEMA}/soda/latest/${name}`);
    console.log(`📁 Colección '${name}' creada.`);
  } catch (err) {
    if (err.response && err.response.status === 409) {
      // Ya existe, ok
      console.log(`📁 Colección '${name}' ya existía.`);
    } else {
      throw err;
    }
  }
}

// 2) Listar colecciones
async function listCollections() {
  const res = await client.get(`/${SCHEMA}/soda/latest/`);
  return res.data.items;
}

// 3) Obtener documentos de una colección
async function getDocs(collectionName) {
  const res = await client.get(`/${SCHEMA}/soda/latest/${collectionName}`);
  return res.data.items;
}

// 4) Insertar documentos en una colección
async function insertDocs(collectionName, docs) {
  const payload = Array.isArray(docs) ? docs : [docs];
  // Crea la colección si no existe
  await ensureCollection(collectionName);
  // Inserta los documentos
  const res = await client.post(
    `/${SCHEMA}/soda/latest/${collectionName}`,
    payload
  );
  return res.data; // información de inserción
}

module.exports = {
  listCollections,
  getDocs,
  insertDocs
};

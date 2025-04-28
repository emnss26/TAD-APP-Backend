const axios = require("axios");

const ORDS_URL = process.env.ORDS_URL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ORDS_URL || !ADMIN_PASSWORD) {
  console.error("❌ Define ORDS_URL (sin /admin) y ADMIN_PASSWORD");
  process.exit(1);
}

const basicAuth = Buffer.from(`ADMIN:${ADMIN_PASSWORD}`).toString("base64");
const client = axios.create({
  baseURL: ORDS_URL,
  headers: {
    Authorization: `Basic ${basicAuth}`,
    "Content-Type": "application/json",
  },
  timeout: 5000,
});

//console.log(`ORDS client configurado en ${ORDS_URL}`);

const SCHEMA = "admin";

async function ensureCollection(name) {
  try {
    await client.put(`/${SCHEMA}/soda/latest/${name}`);
    //console.log(`Created '${name}' collection.`);
  } catch (err) {
    if (err.response && err.response.status === 409) {
      //console.log(`Existing '${name}' collection.`);
    } else {
      console.error(`Error ensuring collection ${name}:`, err.response?.data || err.message);
      throw err;
    }
  }
}

async function listCollections() {
  const res = await client.get(`/${SCHEMA}/soda/latest/`);
  return res.data.items;
}

async function getDocs(collectionName, query = '') {
  const base = `/${SCHEMA}/soda/latest/${collectionName}`;
  const url  = query ? `${base}?${query}` : base;

  console.log(`GET request to: ${url}`);
  try {
    const res = await client.get(url);
    return res.data.items;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.warn(`Collection ${collectionName} not found during GET.`);
      return [];
    }
    console.error(
      `Error getting docs from ${collectionName} with query '${query}':`,
      err.response?.data || err.message
    );
    throw err;
  }
}


async function insertDocs(collectionName, docs) {
  const payload = Array.isArray(docs) ? docs : [docs];
  await ensureCollection(collectionName); // Asegura que la colección exista

  // console.log(`POST request to: /${SCHEMA}/soda/latest/${collectionName} with payload:`, payload); // Log
  try {
    const res = await client.post(
      `/${SCHEMA}/soda/latest/${collectionName}`,
      payload
    );
    return res.data;
  } catch (err) {
      console.error(`Error inserting docs into ${collectionName}:`, err.response?.data || err.message);
      throw err;
  }
}

// --- NUEVA IMPLEMENTACIÓN DE upsertDoc ---
async function upsertDoc(collectionName, key, doc) {
  await ensureCollection(collectionName); // Asegura que la colección exista

  // 1. Buscar el documento por _key
  const query = `q=${encodeURIComponent(JSON.stringify({ "_key": { "$eq": key } }))}&limit=1`;
  let existingDoc = null;
  try {
    // console.log(`Searching for key: ${key} in collection: ${collectionName}`);
    const searchResult = await getDocs(collectionName, query);
    if (searchResult && searchResult.length > 0) {
      existingDoc = searchResult[0];
      // console.log(`Found existing doc with id: ${existingDoc.id} for key: ${key}`);
    } else {
      // console.log(`No existing doc found for key: ${key}`);
    }
  } catch (err) {
    // getDocs ya maneja 404 de colección, aquí capturamos otros errores de búsqueda
    console.error(`Error searching for document with key ${key} in ${collectionName}:`, err.response?.data || err.message);
    throw err; // Relanzar error si la búsqueda falla por otra razón
  }

  // 2. Actualizar si existe, Insertar si no existe
  try {
    if (existingDoc && existingDoc.id) {
      // 2.a. Actualizar (PUT usando el ID interno de SODA)
      const sodaId = existingDoc.id;
      // console.log(`PUT request to: /${SCHEMA}/soda/latest/${collectionName}/${sodaId} with payload:`, doc); // Log
      const resPut = await client.put(
        `/${SCHEMA}/soda/latest/${collectionName}/${encodeURIComponent(sodaId)}`, // Usar el ID interno de SODA
        doc // Enviar el documento completo para reemplazar
      );
      // console.log(`Successfully updated doc with id: ${sodaId} (key: ${key})`);
      return resPut.data;
    } else {
      // 2.b. Insertar (POST - SODA asignará un nuevo ID interno)
      // El documento 'doc' ya debería incluir la propiedad '_key: key' desde el controlador
      // console.log(`POST request (inserting) to: /${SCHEMA}/soda/latest/${collectionName} with payload:`, doc); // Log
      const resPost = await client.post(
        `/${SCHEMA}/soda/latest/${collectionName}`,
        doc // El payload ya contiene _key
      );
      // console.log(`Successfully inserted doc with key: ${key}`);
      return resPost.data;
    }
  } catch (err) {
    console.error(`Error during PUT/POST for key ${key} in ${collectionName}:`, err.response?.data || err.message);
    // Añadir más detalles si están disponibles
    if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response headers:', err.response.headers);
    }
    throw err; // Relanza el error para que el controlador lo maneje
  }
}
// --- FIN NUEVA IMPLEMENTACIÓN ---

module.exports = {
  listCollections,
  getDocs,
  insertDocs,
  upsertDoc
};

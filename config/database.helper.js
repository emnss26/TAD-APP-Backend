// config/database.helper.js

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
  timeout: 60000,
});

const SCHEMA = "admin";
const cache = new Set();

/** Crea la colección si no existe (y lo cachea). */
async function ensureCollection(name) {
  if (!name || typeof name !== "string") {
    throw new Error(`ensureCollection: nombre inválido (${name})`);
  }
  if (cache.has(name)) return;
  try {
    //console.log(`🔨 Creando/asegurando colección "${name}"`);
    await client.put(`/${SCHEMA}/soda/latest/${encodeURIComponent(name)}`);
    cache.add(name);
  } catch (e) {
    if (e.response?.status === 409) {
      // ya existía
      cache.add(name);
    } else {
      //console.error(`❌ Error asegurando colección "${name}":`, e.response?.data || e.message);
      throw e;
    }
  }
}

/** Devuelve los docs que matcheen la query SODA. */
async function getDocs(collectionName, query = "") {
  const url = `/${SCHEMA}/soda/latest/${encodeURIComponent(collectionName)}${query ? `?${query}` : ""}`;
  const res = await client.get(url);
  return res.data.items;
}

/**
 * Inserta o actualiza un único documento usando su _key:
 *  - Si ya hay uno con ese _key, hace PUT /{collection}/{id}
 *  - Si no, hace POST /{collection}
 */
async function upsertDoc(collectionName, doc) {
  if (!doc || typeof doc._key !== "string") {
    throw new Error(`upsertDoc: falta doc._key en ${JSON.stringify(doc)}`);
  }
  await ensureCollection(collectionName);

  const filter = encodeURIComponent(JSON.stringify({ "_key": { "$eq": doc._key } }));
  //console.log(`🔍 Buscando existing ${doc._key} en ${collectionName}`);
  const found = await getDocs(collectionName, `q=${filter}&limit=1`);

  if (found.length) {
    const id = found[0].id;
    //console.log(`➡️  PUT /${SCHEMA}/soda/latest/${collectionName}/${id}`);
    await client.put(
      `/${SCHEMA}/soda/latest/${collectionName}/${encodeURIComponent(id)}`,
      doc
    );
  } else {
    //console.log(`➡️  POST /${SCHEMA}/soda/latest/${collectionName}`);
    await client.post(
      `/${SCHEMA}/soda/latest/${collectionName}`,
      doc
    );
  }
}

/**
 * batchUpsert: recorre el array y llama a upsertDoc uno a uno.
 */
async function batchUpsert(collectionName, docs = []) {
  if (!Array.isArray(docs)) {
    throw new Error("batchUpsert: docs debe ser un array");
  }
  if (docs.length === 0) {
    console.log("batchUpsert: array vacío, nada que hacer");
    return;
  }
  for (const doc of docs) {
    await upsertDoc(collectionName, doc);
  }
}

module.exports = {
  ensureCollection,
  getDocs,
  upsertDoc,
  batchUpsert,
};

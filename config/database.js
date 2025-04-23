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
      throw err;
    }
  }
}

async function listCollections() {
  const res = await client.get(`/${SCHEMA}/soda/latest/`);
  return res.data.items;
}

async function getDocs(collectionName) {
  const res = await client.get(`/${SCHEMA}/soda/latest/${collectionName}`);
  return res.data.items;
}

async function insertDocs(collectionName, docs) {
  const payload = Array.isArray(docs) ? docs : [docs];

  await ensureCollection(collectionName);

  const res = await client.post(
    `/${SCHEMA}/soda/latest/${collectionName}`,
    payload
  );
  return res.data;
}

module.exports = {
  listCollections,
  getDocs,
  insertDocs,
};

const dotenv = require("dotenv");
dotenv.config();

function parsePairs(value, keys) {
  if (!value) return [];
  return value.split(",").map((pair) => {
    const parts = pair.split(":");
    const obj = {};
    keys.forEach((k, i) => {
      obj[k] = (parts[i] || "").trim();
    });
    return obj;
  });
}

const DEFAULT_APPROVED_EMAILS = [
  { email: "enrique.meneses.arq@outlook.com", 
    name: "Enrique Meneses" 
  },
  {
    email: "administracion@mloestructural.com",
    name: "Administracion MLO Estructural",
  },
];

const DEFAULT_AUTHORIZED_HUBS = [
  { id: "b.0b8ddfd1-131f-4b5c-964f-6d9a316b7d11", name: "TAD_HUB" },
  { id: "b.63c92d38-bbe3-4655-97e7-50082f6c627d", name: "MLO Estructural" },
];

const config = {
  // General
  PORT: process.env.PORT,
  FRONTEND_URL: process.env.FRONTEND_URL,
  REDIRECT_URI: process.env.REDIRECT_URI,
  BACKEND_BASE_URL: process.env.BACKEND_BASE_URL,

  //Oracle Database
  ORDS_URL: process.env.ORDS_URL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ORDS_SCHEMA: process.env.ORDS_SCHEMA,

  // MongoDB
  MONGODB_DATABASE_URL: process.env.MONGODB_DATABASE_URL,

  //AI
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,

  // Logging
  NODE_ENV: process.env.NODE_ENV || "development",

  // Autodesk Platform Services
  AUTODESK_BASE_URL: process.env.AUTODESK_BASE_URL,
  APS_CLIENT_ID: process.env.APS_CLIENT_ID,
  APS_CLIENT_SECRET: process.env.APS_CLIENT_SECRET,

  //Approved HUBS adn Emails
  APPROVED_EMAILS: parsePairs(process.env.APPROVED_EMAILS, ["email", "name"])
    .length
    ? parsePairs(process.env.APPROVED_EMAILS, ["email", "name"])
    : DEFAULT_APPROVED_EMAILS,
  AUTHORIZED_HUBS: parsePairs(process.env.AUTHORIZED_HUBS, ["id", "name"])
    .length
    ? parsePairs(process.env.AUTHORIZED_HUBS, ["id", "name"])
    : DEFAULT_AUTHORIZED_HUBS,

  // Token scopes
  TOKEN_SCOPES: {
    threeLegged:
      process.env.THREE_LEGGED_SCOPES ||
      "data:read data:write data:create account:read viewables:read bucket:read",
    twoLegged:
      process.env.TWO_LEGGED_SCOPES ||
      "data:read data:write bucket:create bucket:read bucket:delete",
  },

  // Allowed Origins for CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : [
        process.env.FRONTEND_URL || 
        "http://localhost:5173",
        "https://tad-app-fronend.vercel.app",
      ],
};

module.exports = config;

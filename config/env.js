const dotenv = require('dotenv');
dotenv.config();

const env = {
  PORT: process.env.PORT || 3000,
  FRONTEND_URL: process.env.FRONTEND_URL,
  APS_CLIENT_ID: process.env.APS_CLIENT_ID,
  APS_CLIENT_SECRET: process.env.APS_CLIENT_SECRET,
  REDIRECT_URI: process.env.REDIRECT_URI,
  ORDS_URL: process.env.ORDS_URL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ORDS_SCHEMA: process.env.ORDS_SCHEMA,
  MONGODB_DATABASE_URL: process.env.MONGODB_DATABASE_URL,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
  AUTODESK_BASE_URL: process.env.AUTODESK_BASE_URL
};

module.exports = env;

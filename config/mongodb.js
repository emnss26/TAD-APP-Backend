// config/mongodb.js
const mongoose = require('mongoose');

const url = process.env.MONGODB_DATABASE_URL;
if (!url) {
  console.error('❌ Define MONGODB_DATABASE_URL');
  process.exit(1);
}

// Cache the connection promise in the global object to reuse across invocations
let connPromise = global._mongooseConnectionPromise;
if (!connPromise) {
  connPromise = mongoose.connect(url, {
    tls: true,
    retryWrites: false,
    maxPoolSize: 5000,
    minPoolSize: 10,
    serverSelectionTimeoutMS: 90000,
  });
  global._mongooseConnectionPromise = connPromise;
}

// Log successful connection or errors
connPromise
  .then(() => console.log('✅ MongoDB API connected'))
  .catch((err) => {
    console.error('❌ Error connecting MongoDB API:', err.message);
    process.exit(1);
  });

// Monitor connection events
mongoose.connection.on('disconnected', () =>
  console.warn('⚠️  MongoDB disconnected')
);

mongoose.connection.on('reconnected', () =>
  console.log('🔄 MongoDB reconnected')
);

/**
 * Returns a promise that resolves to the mongoose connection.
 * Usage:
 *   const getDb = require('./config/mongodb');
 *   const db = await getDb();
 */
async function getDb() {
  await connPromise;
  return mongoose.connection;
}

module.exports = getDb;
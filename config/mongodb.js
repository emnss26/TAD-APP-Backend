const env = require('./env.js');
const mongoose = require('mongoose');

const url = env.MONGODB_DATABASE_URL;
if (!url) {
  console.error('❌ Define MONGODB_DATABASE_URL');
  process.exit(1);
}

let connPromise = global._mongooseConnectionPromise;
if (!connPromise) {
  connPromise = mongoose.connect(url, {
    tls: true,
    retryWrites: false,
    maxPoolSize: 50000,
    minPoolSize: 10,
    serverSelectionTimeoutMS: 900000,
  });
  global._mongooseConnectionPromise = connPromise;
}

connPromise
  .then(() => console.debug('✅ MongoDB API connected'))
  .catch((err) => {
    console.error('❌ Error connecting MongoDB API:', err.message);
    process.exit(1);
  });


mongoose.connection.on('disconnected', () =>
  console.warn('⚠️  MongoDB disconnected')
);

mongoose.connection.on('reconnected', () =>
  console.debug('🔄 MongoDB reconnected')
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

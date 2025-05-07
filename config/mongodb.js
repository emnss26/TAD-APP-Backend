const mongoose = require("mongoose");

const url = process.env.MONGODB_DATABASE_URL;
if (!url) {
  console.error("❌ Define MONGODB_DATABASE_URL");
  process.exit(1);
}

mongoose
  .connect(url, {
    tls: true,
    retryWrites: false,
    maxPoolSize: 1000,
    minPoolSize: 10,
    serverSelectionTimeoutMS: 60000,
  })
  .then(() => console.log("✅ MongoDB API connected"))
  .catch((err) => {
    console.error("❌ Error connecting MongoDB API:", err.message);
    process.exit(1);
  });

  mongoose.connection.on('disconnected', () =>
    console.warn('⚠️  MongoDB disconnected')
  );

  mongoose.connection.on('reconnected', () =>
    console.log('🔄 MongoDB re connected')
  );

  function getDb() {
    return mongoose.connection;
  }

  module.exports = { getDb };

// app.js
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const dotenv = require("dotenv");
dotenv.config();

// Importa nuestro cliente ORDS  
const {
  listCollections,
  getDocs,
  insertDocs
} = require("./config/database");

const PORT = process.env.PORT || 3000;
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "https://tad-app-fronend.vercel.app"
];

async function start() {
  const app = express();
  app.use(morgan("dev"));
  app.use(express.json({ limit: "150mb" }));
  app.use(express.urlencoded({ limit: "150mb", extended: true }));
  app.use(
    cors({
      origin: (origin, cb) =>
        !origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error("Not allowed by CORS")),
      credentials: true
    })
  );
  app.use(helmet());
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://trusted.cdn.com", "https://cdn.derivative.autodesk.com"],
        imgSrc: ["'self'", "data:", "https://images.autodesk.com", "https://cdn.derivative.autodesk.com"],
        connectSrc: ["'self'", "https://developer.api.autodesk.com", "https://cdn.derivative.autodesk.com"]
      }
    })
  );
  app.use(cookieParser());

  // Rutas de ejemplo usando ORDS SODA REST
  app.get("/db/collections", async (req, res) => {
    try {
      const cols = await listCollections();
      res.json(cols);
    } catch (e) {
      res.status(500).json({ error: e.toString() });
    }
  });

  app.get("/db/:col", async (req, res) => {
    try {
      const docs = await getDocs(req.params.col);
      res.json(docs);
    } catch (e) {
      res.status(500).json({ error: e.toString() });
    }
  });

  app.post("/db/:col", async (req, res) => {
    try {
      const result = await insertDocs(req.params.col, req.body);
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.toString() });
    }
  });

  // Tus rutas originales
  app.use("/auth", require("./resources/auth/auth.router"));
  app.use("/general", require("./resources/general/general.route"));
  app.use("/acc", require("./resources/acc/acc.router"));
  app.use("/bim360", require("./resources/bim360/bim360.router"));
  app.use("/datamanagement", require("./resources/datamanagement/datamanagement.router"));

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error("Fatal error al iniciar:", err);
  process.exit(1);
});

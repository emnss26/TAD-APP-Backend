// app.js
const express = require("express");
const rateLimit = require('express-rate-limit');
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const dotenv = require("dotenv");
dotenv.config();

const { listCollections, getDocs, insertDocs } = require("./config/database");

const PORT = process.env.PORT || 3000;
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "https://tad-app-fronend.vercel.app", "https://tad-app-fronend.vercel.app",
];

const app = express();
app.use(morgan("dev"));
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));
app.use(
  cors({
    origin: (origin, cb) =>
      !origin || allowedOrigins.includes(origin)
        ? cb(null, true)
        : cb(new Error("Not allowed by CORS")),
    credentials: true,
  })
);
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://trusted.cdn.com",
        "https://cdn.derivative.autodesk.com",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https://images.autodesk.com",
        "https://cdn.derivative.autodesk.com",
      ],
      connectSrc: [
        "'self'",
        "https://developer.api.autodesk.com",
        "https://cdn.derivative.autodesk.com",
      ],
    },
  })
);
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     
  max: 100,                     
  standardHeaders: true,        
  legacyHeaders: false,         
  message: {
    status: 429,
    error: 'Too many requests, please try again later.'
  }
});
app.use(globalLimiter);

app.use(cookieParser());


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


app.use("/auth", require("./resources/auth/auth.router"));
app.use("/general", require("./resources/general/general.route"));
app.use("/acc", require("./resources/acc/acc.router"));
app.use("/bim360", require("./resources/bim360/bim360.router"));
app.use("/datamanagement", require("./resources/datamanagement/datamanagement.router"));

app.get("/", (req, res) => {
  res.json({ message: "TAD‑APP‑Backend API está viva 🚀" });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;

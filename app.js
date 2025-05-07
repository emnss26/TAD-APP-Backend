// app.js
const express = require("express");
const rateLimit = require('express-rate-limit');
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const dotenv = require("dotenv");
dotenv.config();

require ('./config/mongodb.js');

const PORT = process.env.PORT || 3000;
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "https://tad-app-fronend.vercel.app", "https://tad-app-fronend.vercel.app",
];

const app = express();
app.disable('etag');
app.set('trust proxy', 1);
app.use(morgan("dev"));
app.use(express.json({ limit: "250mb" }));
app.use(express.urlencoded({ limit: "250mb", extended: true }));

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','Accept'],
    exposedHeaders: ['Content-Type','Authorization','Accept'],
    credentials: true,
    optionsSuccessStatus: 204  
  })
);

//app.options('*', cors());

app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://trusted.cdn.com",
        "https://cdn.derivative.autodesk.com",
        "https://tad-app-backend.vercel.app",
        "https://tad-app-fronend.vercel.app",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https://images.autodesk.com",
        "https://cdn.derivative.autodesk.com",
        "https://tad-app-backend.vercel.app",
        "https://tad-app-fronend.vercel.app",
      ],
      connectSrc: [
        "'self'",
        "https://developer.api.autodesk.com",
        "https://cdn.derivative.autodesk.com",
        "https://tad-app-backend.vercel.app",
        "https://tad-app-fronend.vercel.app",

      ],
    },
  })
);

const excludedPaths = [
  "/favicon.ico",
  "/auth",
  "/general",
  "/acc",
  "/bim360",
  "/datamanagement",
  "/modeldata",
  "/plans",
  "/task",
];

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     
  max: 100,                     
  standardHeaders: true,        
  legacyHeaders: false,
  skip: (req) => {
    return excludedPaths.some(prefix => req.path.startsWith(prefix));
  },    
  message: {
    status: 429,
    error: 'Too many requests, please try again later.'
  }
});
app.use(globalLimiter);

app.use(cookieParser());

app.use("/auth", require("./resources/auth/auth.router"));
app.use("/general", require("./resources/general/general.route"));
app.use("/acc", require("./resources/acc/acc.router"));
app.use("/bim360", require("./resources/bim360/bim360.router"));
app.use("/datamanagement", require("./resources/datamanagement/datamanagement.router"));
app.use('/modeldata', require ("./resources/model/model.router.js"));
app.use('/plans', require ("./resources/plans/plans.router.js"));
app.use('/task', require ("./resources/task/task.router.js"));
app.use('/ai-users', require ("./openai/general/users.google.ai.js"));
app.use('/ai-issues', require ("./openai/general/issues.google.ai.js"));
app.use('/ai-submittlas', require ("./openai/general/submittals.google.ai.js"));
app.use('/ai-rfis', require ("./openai/general/rfis.google.ai.js"));
app.use('/ai-modeldata', require ("./openai/general/model.google.ai.js"));

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

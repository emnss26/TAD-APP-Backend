const express = require("express");
const rateLimit = require('express-rate-limit');
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const dotenv = require("dotenv");
const csurf = require("csurf");

dotenv.config();
require('./config/mongodb.js');

const PORT = process.env.PORT || 3000;
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "https://tad-app-fronend.vercel.app",
];

const app = express();
app.disable('etag');
app.disable("x-powered-by");
app.set('trust proxy', 1);

// Body parsers
app.use(express.json({ limit: "250mb" }));
app.use(express.urlencoded({ limit: "250mb", extended: true }));

// CORS
app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','Accept','X-CSRF-Token'],
    exposedHeaders: ['Content-Type','Authorization','Accept'],
    credentials: true,
    optionsSuccessStatus: 204  
  })
);
app.options(/.*/, cors());

// Logging
app.use(morgan("dev"));

// Security headers
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
      styleSrc: [
        "'self'",
        "'unsafe-inline'"
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

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   
  max: 60,                    
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, error: 'Too many authentication requests, slow down.' }
});
const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,    
  max: 60,                    
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, error: 'Too many write operations, please wait.' }
});
const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,    
  max: 600,                   
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, error: 'Too many requests, please wait.' }
});

// Cookies and CSRF
app.use(cookieParser());
app.use((req, res, next) => {
  if (
    req.path.startsWith('/ai-') ||
    req.path.startsWith('/datamanagement') ||
    req.path.startsWith('/plans') ||
    req.path.startsWith('/task') ||
    req.path.startsWith('/modeldata') 
  ) {
    return next();
  }
  return csurf({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    },
  })(req, res, next);
});

// Endpoint to obtain the CSRF token
app.get("/csrf-token", (req, res) => {
  res.status(200).json({ csrfToken: req.csrfToken() });
});

// Authentication (login/logout/token)
app.use('/auth', authLimiter, require("./resources/auth/auth.router.js"));

// Apply limits depending on HTTP method
app.use((req, res, next) => {
  if (['POST','PUT','PATCH','DELETE'].includes(req.method)) {
    return writeLimiter(req, res, next);
  }
  if (req.method === 'GET') {
    return readLimiter(req, res, next);
  }
  next();
});

// Autodesk token validation
const validateAutodeskToken = require("./libs/general/validatetoken.js");

// Rutas
app.use("/general", require("./resources/general/general.route.js"));
app.use("/acc", validateAutodeskToken, require("./resources/acc/acc.router.js"));
app.use("/bim360", validateAutodeskToken, require("./resources/bim360/bim360.router.js"));
app.use("/datamanagement", validateAutodeskToken, require("./resources/datamanagement/datamanagement.router.js"));
app.use('/modeldata', require("./resources/model/model.router.js"));
app.use('/plans', require("./resources/plans/plans.router.js"));
app.use('/task', require("./resources/task/task.router.js"));
app.use('/ai-users', require("./openai/general/users.google.ai.js"));
app.use('/ai-issues', require("./openai/general/issues.google.ai.js"));
app.use('/ai-submittals', require("./openai/general/submittals.google.ai.js"));
app.use('/ai-rfis', require("./openai/general/rfis.google.ai.js"));
app.use('/ai-modeldata', require("./openai/general/model.google.ai.js"));

// Health check
app.get("/", (req, res) => {
  res.json({ message: "TAD‑APP‑Backend API is alive 🚀" });
});

// Iniciar servidor (si se ejecuta directamente)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

// Handle invalid CSRF token
app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }
  next(err);
});

// Global error handling
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
    return res.status(err.status || 500).json({
      message: err.message,
      stack: err.stack
    });
  }
  console.error(err.message);
  res.status(err.status || 500).json({ message: 'Internal server error' });
});

module.exports = app;

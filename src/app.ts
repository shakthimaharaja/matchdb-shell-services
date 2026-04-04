import express from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import passport from "passport";
import swaggerUi from "swagger-ui-express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { env } from "./config/env";
import "./config/passport"; // registers Google OAuth strategy (side-effect)
import { swaggerSpec } from "./config/swagger";
import authRoutes from "./routes/auth.routes";
import paymentsRoutes from "./routes/payments.routes";
import userRoutes from "./routes/user.routes";
import { errorHandler, notFound } from "./middleware/error.middleware";

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

// Gzip compression — reduces API response size 60-80%
app.use(compression());

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Passport (stateless — no session middleware needed)
app.use(passport.initialize());

// Rate limiting
app.use("/api/auth", authLimiter);
app.use(limiter);

// ── Gateway proxy — forward /api/jobs to jobs-services ──────────────────────
// Must come BEFORE body parsers so the raw request streams through untouched.
// Use pathFilter (not Express mount) so the full /api/jobs/... path is preserved.
app.use(
  createProxyMiddleware({
    target: env.JOBS_SERVICES_URL,
    changeOrigin: true,
    pathFilter: "/api/jobs",
    on: {
      error(err, _req, res) {
        console.error("[Gateway] /api/jobs proxy error:", err.message);
        if ("writeHead" in res) {
          (res as express.Response)
            .status(502)
            .json({ error: "Jobs service unavailable" });
        }
      },
    },
  }),
);
// Stripe webhook must come BEFORE express.json() (needs raw body)
// It is self-contained in payments.routes with its own raw body parser
app.use("/api/payments", paymentsRoutes);

// JSON body parser for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "matchdb-shell-services",
    env: env.NODE_ENV,
  });
});

// Swagger docs
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "MatchingDB Shell Services — API Docs",
  }),
);

// 404 + error handler
app.use(notFound);
app.use(errorHandler);

export default app;

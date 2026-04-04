/**
 * PM2 Ecosystem — MatchDB Production (GCP VM)
 *
 * Architecture:
 *   nginx (443/80) → static files from dist/ + proxy /api/* to backends
 *   shell-services :8000  — cluster × 2  (Auth, Payments, OAuth)
 *   jobs-services  :8001  — cluster × 2  (Jobs, Profiles, Pokes)
 *
 * Node UI servers (shell-ui/jobs-ui) are NOT started here.
 * nginx serves webpack dist/ directly — far more efficient at scale.
 *
 * Deploy:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 save && pm2 startup
 *
 * Logs:
 *   pm2 logs          — all services
 *   pm2 logs shell-services --lines 200
 */

const BASE = "/opt/matchdb";

module.exports = {
  apps: [
    // ── Auth + Payments backend ──────────────────────────────────────────────
    {
      name: "shell-services",
      script: "dist/index.js", // compiled JS — no tsx overhead
      cwd: `${BASE}/matchdb-shell-services`,
      instances: 2, // 2 workers × 10 PG connections = 20 total
      exec_mode: "cluster",
      node_args: "--max-old-space-size=512",

      env_production: {
        NODE_ENV: "production",
        PORT: 8000,
      },

      // ── Reliability ────────────────────────────────────────────────────────
      max_memory_restart: "400M", // restart worker if memory leaks
      restart_delay: 3000, // wait 3 s between restarts
      max_restarts: 10,
      min_uptime: "10s", // must stay up 10 s to count as "started"
      kill_timeout: 5000, // give SIGTERM 5 s before SIGKILL

      // ── Logging ────────────────────────────────────────────────────────────
      out_file: `${BASE}/logs/shell-services-out.log`,
      error_file: `${BASE}/logs/shell-services-err.log`,
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },

    // ── Jobs + Profiles backend ──────────────────────────────────────────────
    {
      name: "jobs-services",
      script: "dist/index.js",
      cwd: `${BASE}/matchdb-jobs-services`,
      instances: 2, // 2 workers × 10 PG connections = 20 total
      exec_mode: "cluster",
      node_args: "--max-old-space-size=512", // MongoDB Atlas handles connection pooling — no local DB connections to manage
      env_production: {
        NODE_ENV: "production",
        PORT: 8001,
      },

      max_memory_restart: "400M",
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: "10s",
      kill_timeout: 5000,

      out_file: `${BASE}/logs/jobs-services-out.log`,
      error_file: `${BASE}/logs/jobs-services-err.log`,
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};

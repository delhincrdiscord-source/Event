// ====================================================
// PM2 Ecosystem Config — Delhi NCR Gameverse 2026
// ====================================================
// Usage: pm2 start ecosystem.config.js
// ====================================================

module.exports = {
  apps: [
    // ── Dashboard (Next.js) ──────────────────────
    {
      name: "gameverse-dashboard",
      script: "pnpm",
      args: "--filter @gameverse/dashboard exec next start -p 3000",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
      exp_backoff_restart_delay: 100,
      watch: false,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/dashboard-error.log",
      out_file: "logs/dashboard-out.log",
      merge_logs: true,
    },

    // ── Discord Bot ───────────────────────────────
    {
      name: "gameverse-bot",
      script: "pnpm",
      args: "--filter @gameverse/bot exec tsx src/index.ts",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "256M",
      exp_backoff_restart_delay: 100,
      watch: false,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/bot-error.log",
      out_file: "logs/bot-out.log",
      merge_logs: true,
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};

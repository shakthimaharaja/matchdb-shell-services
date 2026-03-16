/* =============================================================================
 * matchdb-shell-services — Centralized constants
 * Single source of truth for business rules and domain config.
 * ============================================================================= */

// ─── Visibility Domain Constants ───────────────────────────────────────────────

export const CONTRACT_SUBDOMAINS = ["c2c", "c2h", "w2", "1099"];
export const FULLTIME_SUBDOMAINS = ["c2h", "w2", "direct_hire", "salary"];

// ─── Email Theme (shared with jobs-services) ───────────────────────────────────

export const EMAIL_COLORS = {
  primary: "#1d4479",
  primaryLight: "#3b6fa6",
  accent: "#a8cbf5",
} as const;

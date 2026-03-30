import { Request, Response } from "express";
import { User } from "../models/User";

const ALLOWED_THEME_MODES = ["legacy", "classic", "modern"] as const;
const ALLOWED_COLOR_SCHEMES = ["light", "dark", "auto"] as const;
const ALLOWED_TEXT_SIZES = ["small", "medium", "large"] as const;

/**
 * GET /api/user/preferences
 * Returns the authenticated user's appearance preferences.
 */
export async function getPreferences(
  req: Request,
  res: Response,
): Promise<void> {
  const user = await User.findById(req.user!.userId).select("preferences");
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const prefs = user.preferences ?? {
    themeMode: "legacy",
    colorScheme: "light",
    textSize: "medium",
  };

  res.json(prefs);
}

/**
 * PUT /api/user/preferences
 * Updates the authenticated user's appearance preferences.
 */
export async function updatePreferences(
  req: Request,
  res: Response,
): Promise<void> {
  const { themeMode, colorScheme, textSize } = req.body ?? {};

  // Validate
  if (themeMode && !ALLOWED_THEME_MODES.includes(themeMode)) {
    res.status(400).json({ error: "Invalid themeMode" });
    return;
  }
  if (colorScheme && !ALLOWED_COLOR_SCHEMES.includes(colorScheme)) {
    res.status(400).json({ error: "Invalid colorScheme" });
    return;
  }
  if (textSize && !ALLOWED_TEXT_SIZES.includes(textSize)) {
    res.status(400).json({ error: "Invalid textSize" });
    return;
  }

  const update: Record<string, string> = {};
  if (themeMode) update["preferences.themeMode"] = themeMode;
  if (colorScheme) update["preferences.colorScheme"] = colorScheme;
  if (textSize) update["preferences.textSize"] = textSize;

  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const user = await User.findByIdAndUpdate(
    req.user!.userId,
    { $set: update },
    { new: true, runValidators: true },
  ).select("preferences");

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user.preferences);
}

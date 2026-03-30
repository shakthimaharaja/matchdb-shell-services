import mongoose, { Schema } from "mongoose";

export interface IUserPreferences {
  themeMode: "legacy" | "classic" | "modern";
  colorScheme: "light" | "dark" | "auto";
  textSize: "small" | "medium" | "large";
}

export interface IUser {
  _id: string;
  email: string;
  password?: string;
  googleId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  userType: string;
  membershipConfig?: string;
  hasPurchasedVisibility: boolean;
  isActive: boolean;
  preferences: IUserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const PreferencesSchema = new Schema<IUserPreferences>(
  {
    themeMode: {
      type: String,
      enum: ["legacy", "classic", "modern"],
      default: "legacy",
    },
    colorScheme: {
      type: String,
      enum: ["light", "dark", "auto"],
      default: "light",
    },
    textSize: {
      type: String,
      enum: ["small", "medium", "large"],
      default: "medium",
    },
  },
  { _id: false },
);

const UserSchema = new Schema<IUser>(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, default: null },
    googleId: { type: String, sparse: true, unique: true },
    username: { type: String, sparse: true, unique: true },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    userType: { type: String, default: "candidate" },
    membershipConfig: { type: String, default: null },
    hasPurchasedVisibility: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    preferences: {
      type: PreferencesSchema,
      default: () => ({
        themeMode: "legacy",
        colorScheme: "light",
        textSize: "medium",
      }),
    },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", UserSchema);

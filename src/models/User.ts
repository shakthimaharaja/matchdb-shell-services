import mongoose, { Schema } from "mongoose";

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
  createdAt: Date;
  updatedAt: Date;
}

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
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", UserSchema);

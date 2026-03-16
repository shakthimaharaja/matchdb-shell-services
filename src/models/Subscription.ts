import mongoose, { Schema } from "mongoose";

export interface ISubscription {
  _id: string;
  userId: string;
  stripeCustomerId?: string;
  stripePriceId?: string;
  stripeSubId?: string;
  plan: string;
  status: string;
  currentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    userId: { type: String, required: true, unique: true },
    stripeCustomerId: { type: String, sparse: true, unique: true },
    stripePriceId: { type: String, default: null },
    stripeSubId: { type: String, default: null },
    plan: { type: String, default: "free" },
    status: { type: String, default: "inactive" },
    currentPeriodEnd: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Subscription = mongoose.model<ISubscription>(
  "Subscription",
  SubscriptionSchema,
);

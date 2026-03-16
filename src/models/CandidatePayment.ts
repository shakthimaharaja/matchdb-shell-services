import mongoose, { Schema } from "mongoose";

export interface ICandidatePayment {
  _id: string;
  userId: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  packageType: string;
  domain?: string;
  subdomains: string;
  amountCents: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const CandidatePaymentSchema = new Schema<ICandidatePayment>(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    userId: { type: String, required: true, index: true },
    stripeSessionId: { type: String, required: true, unique: true },
    stripePaymentIntentId: { type: String, default: null },
    packageType: { type: String, required: true },
    domain: { type: String, default: null },
    subdomains: { type: String, required: true },
    amountCents: { type: Number, required: true },
    status: { type: String, default: "pending" },
  },
  { timestamps: true },
);

export const CandidatePayment = mongoose.model<ICandidatePayment>(
  "CandidatePayment",
  CandidatePaymentSchema,
);

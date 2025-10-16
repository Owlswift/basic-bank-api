import { Document, Schema, model, Types } from "mongoose";
import { IAccount } from "./account.entities";
import { TransferStatus } from "../types/common";

export interface ITransfer extends Document {
  fromAccount: Types.ObjectId | IAccount;
  toAccount: Types.ObjectId | IAccount;
  amount: number;
  currency: string;
  status: TransferStatus;
  reference: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transferSchema = new Schema<ITransfer>(
  {
    fromAccount: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    toAccount: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      default: "NGN",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"] as TransferStatus[],
      default: "pending",
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const TransferModel = model<ITransfer>("Transfer", transferSchema);

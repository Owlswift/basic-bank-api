import { Document, Schema, model, Types } from "mongoose";
import { IUser } from "./user.model";

export interface IAccount extends Document {
  accountNumber: string;
  userId: Types.ObjectId | IUser;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const accountSchema = new Schema<IAccount>(
  {
    accountNumber: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{10}$/, "Account number must be 10 digits"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "NGN",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

accountSchema.index(
  { userId: 1, isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);

export const AccountModel = model<IAccount>("Account", accountSchema);

import mongoose from "mongoose";

const paymentHistorySchema = new mongoose.Schema(
  {
    transaction_number: {
      type: String,
      required: [true, "Transaction number is required"],
      unique: true,
      trim: true,
      index: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventUser",
      required: false,
      index: true,
    },

    total_payable: {
      type: Number,
      required: [true, "Total payable amount is required"],
      min: [0, "Amount cannot be negative"], // Changed from positive number check
      default: 0,
    },

    pay_method: {
      type: String,
      enum: {
        values: ["Credit Card", "Debit Card", "UPI", "NetBanking", "Wallet", "Cash", "Other"],
        message: "{VALUE} is not a valid payment method",
      },
      default: "Other",
    },

    pay_status: {
      type: String,
      enum: {
        values: ["Pending", "Completed", "Failed", "Refunded"],
        message: "{VALUE} is not a valid payment status",
      },
      default: "Pending",
      index: true,
    },

    pay_mode: {
      type: String,
      enum: {
        values: ["Online", "Offline"],
        message: "{VALUE} is not a valid payment mode",
      },
      default: "Online",
    },

    payment_date: {
      type: Date,
      default: Date.now,
    },

    remarks: {
      type: String,
      trim: true,
      maxlength: [500, "Remarks cannot exceed 500 characters"],
    },

    show: {
      type: Boolean,
      default: true,
    },

    package: {
      packageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EventPackage",
        required: false,
      },
      slot: {
        type: String,
        trim: true,
      },
    },

    individualTicket: {
      ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ticket",
        required: false,
      },
      slot: {
        type: String,
        trim: true,
      },
    },

    refund_amount: {
      type: Number,
      min: [0, "Refund amount cannot be negative"],
      default: 0,
    },

    refund_date: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
paymentHistorySchema.index({ companyId: 1, pay_status: 1 });
paymentHistorySchema.index({ userId: 1, payment_date: -1 });
paymentHistorySchema.index({ companyId: 1, payment_date: -1 });

export default mongoose.model("PaymentHistory", paymentHistorySchema);
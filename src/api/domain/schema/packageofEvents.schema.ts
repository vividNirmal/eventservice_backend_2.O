import mongoose from "mongoose";

const eventPackageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Package title is required"],
      trim: true,
      unique: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
    },
    companyId: {
      type: mongoose.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
    },
    package_total_price: {
      type: String,
      default: "0",
    },
    currency: {
      type: String,
      enum: ['USD', 'INR', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED'],
      required: [true, "Currency is required"],
      default: 'USD'
    },
    event_package: [
      {
        event_Id: {
          type: mongoose.Types.ObjectId,
          ref: "EventHost",
          required: [true, "Event ID is required"],
        },
        event_category: {
          type: mongoose.Types.ObjectId,
          ref: "EventCategory",
          required: [true, "Event category is required"],
        },
        ticketType :{
          type : String,
          require :false
        },
        ticketSlot :{
          type :String,
          require : false
        },
        event_price: {
          type: String,
          default: "0",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
eventPackageSchema.index({ title: 1 });
eventPackageSchema.index({ companyId: 1 });

export default mongoose.model("EventPackage", eventPackageSchema);
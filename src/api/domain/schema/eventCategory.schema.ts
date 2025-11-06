import mongoose from "mongoose";

const eventCategorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Category title is required"],
      trim: true,
      unique: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    compayId : {type : mongoose.Types.ObjectId , ref : 'Company'}
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index for better query performance
eventCategorySchema.index({ title: 1, isActive: 1 });

export default mongoose.model("EventCategory", eventCategorySchema);

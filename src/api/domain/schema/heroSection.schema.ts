import mongoose, { Document, Schema } from "mongoose";

export interface IHeroSection extends Document {
    title: string;
    description: string,
    image: string;
    companyId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const heroSectionSchema: Schema = new Schema<IHeroSection>({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
}, {
    timestamps: true,
});

// Indexes for better performance
heroSectionSchema.index({ companyId: 1 });
heroSectionSchema.index({ createdAt: -1 });

export default mongoose.model<IHeroSection>("HeroSection", heroSectionSchema);

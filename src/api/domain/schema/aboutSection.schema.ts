import mongoose, { Document, Schema } from "mongoose";

export interface IAboutSection extends Document {
    title: string;
    description: string,
    companyId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const aboutSectionSchema: Schema = new Schema<IAboutSection>({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
}, {
    timestamps: true,
});

// Indexes for better performance
aboutSectionSchema.index({ companyId: 1 });
aboutSectionSchema.index({ createdAt: -1 });

export default mongoose.model<IAboutSection>("AboutSection", aboutSectionSchema);

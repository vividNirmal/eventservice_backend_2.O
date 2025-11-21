import mongoose, { Document, Schema } from "mongoose";

export interface IHero {
    image: string;
    title: string;
    description: string;
}

export interface IHeroSection extends Document {
    hero: IHero[];
    companyId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const heroSchema = new Schema<IHero>({
    image: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true }
});


const heroSectionSchema: Schema = new Schema<IHeroSection>({
    hero: { type: [heroSchema], default: [] },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
}, {
    timestamps: true,
});

// Indexes for better performance
heroSectionSchema.index({ companyId: 1 }, { unique: true });
heroSectionSchema.index({ createdAt: -1 });

export default mongoose.model<IHeroSection>("HeroSection", heroSectionSchema);

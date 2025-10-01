import mongoose, { Document, Schema } from "mongoose";


export interface ICountry extends Document {
    name: string;
}

const CountrySchema: Schema = new Schema<ICountry>(
    {
        name: { type: String, required: true },
    },
    {
        collection: "countries",
        timestamps: true,        
    }
);

export default mongoose.model<ICountry>("Country", CountrySchema);

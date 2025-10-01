import mongoose, { Document, Schema } from "mongoose";


export interface ICity extends Document {
    state_id: string;
    name: string;
}

const CitySchema: Schema = new Schema<ICity>(
    {
        name: { type: String, required: true },
        state_id: { type: String, required: true },
    },
    {
        collection: "cities",
        timestamps: true,        
    }
);

export default mongoose.model<ICity>("City", CitySchema);

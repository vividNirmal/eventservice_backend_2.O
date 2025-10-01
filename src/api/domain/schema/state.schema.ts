import mongoose, { Document, Schema } from "mongoose";


export interface IState extends Document {
    country_id: string;
    name: string;
}

const StateSchema: Schema = new Schema<IState>(
    {
        name: { type: String, required: true },
        country_id: { type: String, required: true },
    },
    {
        collection: "states",
        timestamps: true,        
    }
);

export default mongoose.model<IState>("State", StateSchema);

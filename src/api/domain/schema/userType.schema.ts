import mongoose from "mongoose";

const userTypeSchema = new mongoose.Schema({
    type: { type: String, required: true },
    description: { type: String },
    permissions: { type: [String], default: [] },
}, { _id: false });

export default mongoose.model('UserType', userTypeSchema)  ;
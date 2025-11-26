import { string } from "joi";
import mongoose, { Document, Schema } from "mongoose";

type ClearedChat = {
    chatId: mongoose.Types.ObjectId; // Reference to the Chat ID
    clearedAt: Date; // Timestamp of when the chat was cleared
};

export interface IUser extends Document {
    company_id:string;
    name: string; // Full name
    email: string; // Email address
    password: string; //Password
    profilePicture:string//User profile
    role:string//User profile
    otp?:string
    otpExpires?: Date;
    status:number;
    createdAt: Date; // Timestamp of account creation
    updatedAt: Date; // Timestamp of last account update
    
}

const userSchema:Schema = new Schema<IUser>({
    company_id:{
        type: String
    },
    name: {
        type: String,
        trim: true
    },
    email: {
        type: String, unique: true, sparse: true, trim: true
    },
    password: { type: String },
    profilePicture: { type: String },
    role: { type: String }, 
    otp:{ type: String },
    otpExpires: { type: Date },
    status:{ type: Number, required: false,default: 1 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>("User", userSchema);
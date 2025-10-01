import { string } from "joi";
import mongoose, { Document, Schema } from "mongoose";

export interface IscannermachineSchema extends Document {
    scanner_name:string;
    scanner_unique_id:string;
    status:string;
    company_id:string;
    expired_date:Date;
    password:string;
    device_key:string;
    device_type:string;
}

const scannermachineSchema: Schema = new Schema<IscannermachineSchema>({
    scanner_name:{ type: String, required: true },
    scanner_unique_id:{ type: String, required: true },
    status:{ type: String, required: false,default:"1" },
    company_id:{ type: String, required: false },
    expired_date:{ type: Date, required: false },
    password:{ type: String, required: false },
    device_key:{ type: String, required: false },
    device_type:{ type: String, required: false },
},
{
    timestamps: true,
});

export default mongoose.model<IscannermachineSchema>("Scannermachine", scannermachineSchema);

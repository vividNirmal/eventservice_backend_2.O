import { string } from "joi";
import mongoose, { Document, Schema } from "mongoose";

export interface IcompanySchema extends Document {
    company_name:string;
    address:string;
    gst_number:string;
    owner_name:string;
    email_one:string;
    email_two:string;
    subdomain:string;
    status:number;
    logo?: string; // Optional field for logo
    exhibitor_dashboard_banner?: string; // Optional field for logo
    attandess_dashboard_banner? :string
}

const companySchema: Schema = new Schema<IcompanySchema>({
    company_name:{ type: String, required: true, trim: true },
    address:{ type: String, required: true, trim: true },
    gst_number:{ type: String, required: true, trim: true },
    owner_name:{ type: String, required: true, trim: true },
    email_one:{ type: String, required: true, trim: true },
    email_two:{ type: String, required: false, trim: true },
    subdomain:{ type: String, required: true, trim: true },
    status:{ type: Number, required: false,default: 1 },
    logo: { type: String, required: false }, // Optional field for logo
    exhibitor_dashboard_banner : {type:String,required :false},
    attandess_dashboard_banner : {type:String,required :false},
},
{
    timestamps: true,
});

export default mongoose.model<IcompanySchema>("Company", companySchema);

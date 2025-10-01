import mongoose, { Document, Schema } from "mongoose";


export interface IAdminCompany extends Document {
    like_to_visit: string;
    company_id: string;
    company_type: string;
    address_type: string;
    company_name: string;
    company_email: string;
    country_number: string;
    country_code: string;
    business_nature: string;
    address_one: string;
    address_two: string;
    pincode: string;
    country: string;
    city: string;
    objective_of_visiting: string;
    first_learn_about: string;
    product_dealing: string;
    company_document: string;
    company_website: string;
}

const AdminCompanySchema: Schema = new Schema<IAdminCompany>(
    {
        like_to_visit: { type: String, required: true, default:"no"},
        company_id: { type: String, required: true },
        company_type: { type: String, required: true },
        address_type: { type: String, required: true },
        company_name: { type: String, required: true },
        company_email: { type: String, required: true },
        country_number: { type: String, required: true },
        country_code: { type: String, required: true },
        business_nature: { type: String, required: true },
        address_one: { type: String, required: true },
        address_two: { type: String, required: true },
        pincode: { type: String, required: true },
        country: { type: String, required: true },
        product_dealing: { type: String, required: true },
        objective_of_visiting: { type: String, required: true },
        first_learn_about: { type: String, required: true },
        city: { type: String, required: true },
        company_document: { type: String },
        company_website: { type: String, required: true },
    },
    {
        collection: "admin_company",
        timestamps: true,        
    }
);

export default mongoose.model<IAdminCompany>("AdminCompany", AdminCompanySchema);

import mongoose, { Document, Schema } from "mongoose";


export interface ICompanyTeam extends Document {
    company_id: string;
    profile_picture: string;
    first_name: string;
    last_name: string;
    email: string;
    country_code: string;
    contact_no: string;
    ownership: string;
    birth_date: string;
    gender: string;
    address_one: string;
    address_two: string;
    pincode: string;
    country: string;
    city: string;
    passport_no: string;
    passport_image: string;
    valid_upto: string;
    origin: string;
    visa_recommendation: string;
    business_card: string;
    admin_company_id: mongoose.Schema.Types.ObjectId;
}

const CompanyTeamSchema: Schema = new Schema<ICompanyTeam>(
    {
        company_id: { type: String, required: true},
        admin_company_id: { type: mongoose.Schema.Types.ObjectId, ref: "AdminCompany", required: true },
        profile_picture: { type: String, required: false },
        first_name: { type: String, required: true },
        last_name: { type: String, required: true },
        email: { type: String, required: true },
        country_code: { type: String, required: true },
        contact_no: { type: String, required: true },
        ownership: { type: String, required: true },
        birth_date: { type: String, required: true },
        gender: { type: String, required: true },
        address_one: { type: String, required: true },
        address_two: { type: String, required: true },
        pincode: { type: String, required: true },
        country: { type: String, required: true },
        city: { type: String, required: true },
        passport_no: { type: String, required: true },
        passport_image: { type: String, required: false },
        valid_upto: { type: String,required: true },
        origin: { type: String, required: true },
        visa_recommendation: { type: String, required: true },
        business_card: { type: String, required: false },
    },
    {
        collection: "company_team",
        timestamps: true,        
    }
);

export default mongoose.model<ICompanyTeam>("CompanyTeam", CompanyTeamSchema);

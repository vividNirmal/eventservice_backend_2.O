import mongoose, { Document, Schema } from "mongoose";

export interface ICompanyTeam extends Document {
  first_name: string;
  last_name: string;
  profile_picture: string;
  email: string;
  country_code: string;
  contact_no: string;
  birth_date: string;
  gender: string;
  ownership: string;
  pincode: string;
  city: string;
  eventuse_id: mongoose.Schema.Types.ObjectId
}

const EventUserCompanyTeamSchema    : Schema = new Schema<ICompanyTeam>(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    profile_picture: { type: String, required: false },
    email: { type: String, required: true },
    country_code: { type: String, required: true },
    contact_no: { type: String, required: true },
    birth_date: { type: String, required: true },
    gender: { type: String, required: true },
    ownership: { type: String, required: true },
    pincode: { type: String, required: true },
    city: { type: String, required: true },
    eventuse_id : { type: mongoose.Schema.Types.ObjectId, ref: "AdminCompany", required: true },
  },
);

export default mongoose.model<ICompanyTeam>("EventUserCompanyTeam", EventUserCompanyTeamSchema);

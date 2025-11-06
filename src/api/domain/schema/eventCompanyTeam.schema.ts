import mongoose, { Document, Schema } from "mongoose";

export interface IEventCompanyTeam extends Document {
  first_name: string;
  last_name: string;
  profile_picture: string;
  email: string;
  contact_no: string;
  pan_no: string;
  pan_card: string;
  ownership: string;
  birth_date: string;
  gender: string;
  address_line1: string;
  address_line2: string;
  pincode: string;
  country: mongoose.Schema.Types.ObjectId;
  state: mongoose.Schema.Types.ObjectId;
  city: mongoose.Schema.Types.ObjectId;
  eventUser: mongoose.Schema.Types.ObjectId
}

const EventCompanyTeamSchema: Schema = new Schema<IEventCompanyTeam>(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    profile_picture: { type: String, required: false },
    email: { type: String, required: true },
    contact_no: { type: String, required: true },
    pan_no: { type: String },
    pan_card: { type: String },
    ownership: { 
      type: String, 
      required: true,
      enum: ['owner', 'employee']
    },
    birth_date: { type: String, required: true },
    gender: { 
      type: String, 
      required: true,
      enum: ['male', 'female', 'other']
    },
    address_line1: { type: String, required: true },
    address_line2: { type: String },
    pincode: { type: String, required: true },
    country: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Country", 
      required: true 
    },
    state: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "State", 
      required: true 
    },
    city: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "City", 
      required: true 
    },
    eventUser : { type: mongoose.Schema.Types.ObjectId, ref: "EventUser", required: true },
  },
);

export default mongoose.model<IEventCompanyTeam>("EventCompanyTeam", EventCompanyTeamSchema);

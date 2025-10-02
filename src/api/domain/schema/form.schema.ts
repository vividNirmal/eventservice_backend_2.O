import mongoose, { Document, Schema } from "mongoose";

export interface IValidator {
  type: string;
  text: string;
  regex?: string;
}

export interface IElement {
  name: string;
  type: string;
  title: string;
  isRequired: boolean;
  requiredErrorText?: string;
  validators?: IValidator[];
  placeHolder?: string;
  inputType?: string;
  isPrimary?: boolean;
  fieldType?: string;  
}

export interface IPage {
  name: string;
  description?: string;
  elements: IElement[];
}

export interface IForm extends Document {
  formName: string;
  description?: string;
  userType: string;
  pages: IPage[];
  settings?: any;
  companyId?: mongoose.Types.ObjectId;
  eventId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const validatorSchema = new Schema<IValidator>(
  {
    type: { type: String, required: true },
    text: { type: String, required: true },
    regex: { type: String },
  },
  { _id: false }
);

const elementSchema = new Schema<IElement>(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    isRequired: { type: Boolean, default: false },
    requiredErrorText: { type: String },
    validators: [validatorSchema],
    placeHolder: { type: String },
    inputType: { type: String },
    isPrimary: { type: Boolean, default: false },
    fieldType: { type: String, default: "DEFAULT" },
  },
  { _id: false }
);

const pageSchema = new Schema<IPage>(
  {
    name: { type: String, required: true },
    description: { type: String },
    elements: [{ type: Schema.Types.Mixed }],
  },
  { _id: false }
);

const formSchema = new Schema<IForm>(
  {
    formName: { type: String, required: true },
    userType: {
      type: String,
      required: true,
      enum: [
        "Event Attendee",
        "Exhibiting Company",
        "Sponsor",
        "Speaker",
        "Service Provider",
        "Accompanying",
      ],
    },
    pages: [pageSchema],
    settings: { type: Schema.Types.Mixed },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    eventId: { type: Schema.Types.ObjectId, ref: "EventHost" },
  },
  { timestamps: true }
);

export default mongoose.model<IForm>("Form", formSchema);

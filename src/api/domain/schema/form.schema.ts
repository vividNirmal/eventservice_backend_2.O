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
  userType: mongoose.Types.ObjectId;
  pages: IPage[];
  settings?: any;
  companyId?: mongoose.Types.ObjectId;
  eventId?: mongoose.Types.ObjectId;
  isAdminForm: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
      type: mongoose.Schema.Types.ObjectId, 
      ref: "UserType", 
      required: function() {
        return !(this as IForm).isAdminForm;
      } 
    },
    pages: [pageSchema],
    settings: { type: Schema.Types.Mixed },
    companyId: { 
      type: Schema.Types.ObjectId, 
      ref: "Company",
      required: function() {
        return !(this as IForm).isAdminForm;
      }
    },
    eventId: { 
      type: Schema.Types.ObjectId, 
      ref: "EventHost",
      required: function() {
        return !(this as IForm).isAdminForm;
      }
    },
    isAdminForm: { type: Boolean, default: false } // New field
  },
  { timestamps: true }
);

export default mongoose.model<IForm>("Form", formSchema);

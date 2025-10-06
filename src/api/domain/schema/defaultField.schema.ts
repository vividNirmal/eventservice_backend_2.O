import mongoose from "mongoose";

const validatorSchema = new mongoose.Schema(
  {
    type: { type: String }, // validator type (minLength, maxLength, etc.)
    text: { type: String }, // message
    regex: { type: String }, // regex string
  },
  { _id: false } // prevent creating _id for each validator
);

const defaultFieldSchema = new mongoose.Schema(
  {
    fieldTitle :{type: String, required: true },
    fieldName: { type: String, required: true },
    fieldType: { type: String, required: true },
    isRequired: { type: Boolean, default: false },
    requiredErrorText: { type: String },
    placeHolder: { type: String },
    inputType: { type: String },
    isPrimary: { type: Boolean, default: false },
    fieldOptions: { type: [String] }, // For fields like dropdown, radio, etc.
    validators: { type: [validatorSchema], default: [] },
    icon: { type: String },
    userType: { type: [String] },
    userFieldMapping : { type: [String] },
    fieldDescription: { type: String },
    fieldminLimit: { type: String },
    fieldmaxLimit: { type: String },
    specialCharactor: { type: Boolean, default: false },
    fieldPermission :{type :String}
  },
  { timestamps: true, autoIndex: true }
);

export default mongoose.model("DefaultField", defaultFieldSchema);

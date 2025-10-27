import mongoose from "mongoose";

const validatorSchema = new mongoose.Schema(
  {
    type: { type: String }, // validator type (minLength, maxLength, etc.)
    text: { type: String }, // message
    regex: { type: String }, // regex string
  },
  { _id: false } // prevent creating _id for each validator
);
const fileValidation  =  new mongoose.Schema({
  fileType : {type : []},
  fileSize  : {type : String}
});
const fieldConfigration = new mongoose.Schema({
  type : {type :String},
  content : {type :String},
})  
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
    fieldOptions: { type: [] }, // For fields like dropdown, radio, etc.
    validators: { type: [validatorSchema], default: [] },
    icon: { type: String },
    userType: { type: [String] },
    userFieldMapping : { type: [String] },
    fieldDescription: { type: String },
    fieldminLimit: { type: String },
    fieldmaxLimit: { type: String },
    specialCharactor: { type: Boolean, default: false },
    fieldPermission :{type :String},
    optionUrl : {type : String},
    optionPath : {type : String},
    optionValue : {type :String},
    optionName : {type : String},
    optionRequestType : {type :String},
    optionDepending : {type : String},
    filevalidation : {type:[fileValidation],default :[]},
    fieldConfigration : {type:[fieldConfigration],default :[]},
    mapField : {type : String}
  },
  { timestamps: true, autoIndex: true }
);

export default mongoose.model("DefaultField", defaultFieldSchema);

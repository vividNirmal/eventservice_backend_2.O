import mongoose, { Document, Schema } from "mongoose";

export interface IForm extends Document {
    formName: string;
    userType: string;
    formFields: any[]; // Allow flexible JSON objects for form fields
    settings?: any; // Allow flexible settings object
    createdAt: Date;
    updatedAt: Date;
    companyId?: mongoose.Types.ObjectId; // Optional field for multi-company support
    eventId?: mongoose.Types.ObjectId; // Optional field to link form to an event
}

const formSchema: Schema = new Schema<IForm>({
    formName: { type: String, required: true },
    userType: { 
        type: String, 
        required: true,
        enum: ['Event Attendee', 'Exhibiting Company', 'Sponsor', 'Speaker', 'Service Provider', 'Accompanying']
    },
    formFields: [{ type: Schema.Types.Mixed }], // Allow flexible JSON objects
    settings: { type: Schema.Types.Mixed }, // Allow flexible settings object
    companyId: { type: Schema.Types.ObjectId, ref: "Company" }, // Reference to the company
    eventId: { type: Schema.Types.ObjectId, ref: "EventHost" } // Reference to the eventhost
}, {
    timestamps: true,
});

export default mongoose.model<IForm>("Form", formSchema);

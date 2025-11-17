import mongoose, { Document, Schema } from "mongoose";


// ----------------------
// INTERFACES
// ----------------------

// Basic Info
export interface IBasicInfo {
    full_name: string;
    form_number: number;
    due_date: Date;
    submission_disclaimer: string;
    form_description: string;
    measurement_unit: string;
    allow_multiple_submission: boolean;
    is_mendatory: boolean;
    dependant_form: mongoose.Types.ObjectId;
    dependant_features?: string;
    limit_quantity_for_all: boolean;
    payment_collection_required: boolean;
    payment_collection_mode?: string;
    offline_payment_option?: string[];
    tds_applicable: boolean;
    payment_instructions?: string;
    service_provider?: string[];
    stall_type: string;
    apply_vendor_filter: boolean;
    apply_zone_filter: boolean;
    submit_without_pay_verify: boolean;
    machinery_wbs?: string;
    jewllery_wbs?: string;
    allow_personal_cctv_installation: boolean;
}

// Media Info
export interface ISupportingDocument {
    name: string;   // user-entered name
    path: string;   // file path
}

export interface IMediaInfo {
    important_instructions_image: string; // image path
    supporting_documents: ISupportingDocument[]; // array of name + path objects
}


// Other Info
export interface IOtherInfo {
    terms_and_condition: string;
    ofline_order_summary?: string;
}

// Notifications
export interface INotificationTemplate {
    typeId: mongoose.Types.ObjectId;     // Ref: TemplateType
    templateId: mongoose.Types.ObjectId; // Ref: Template or UserTemplate
    actionType: string;                  // From TemplateType.actionType
    isCustom: boolean;   // To distinguish between admin/user template; if isCustom then its UserTemplate
    templateRef?: string;  // Make this optional in the interface
}

export interface INotificationDetail {
    enabled: boolean;
    templates: INotificationTemplate[];
}
export interface INotifications {
    emailNotification: INotificationDetail;
    smsNotification: INotificationDetail;
    whatsappNotification: INotificationDetail;
}

export interface IExhibitorForm extends Document {
    basicInfo: IBasicInfo; // Basic info
    mediaInfo: IMediaInfo; // Media Info    
    otherInfo: IOtherInfo; // Other Info    
    notifications: INotifications; // Notifications

    // System fields
    status: 'published' | 'unpublished';
    createdAt: Date;
    updatedAt: Date;
    companyId?: mongoose.Types.ObjectId;
    eventId?: mongoose.Types.ObjectId;
    exhibitorFormConfigurationId: mongoose.Types.ObjectId;
}


// ----------------------
// SCHEMAS
// ----------------------

// Basic Info Schema
const basicInfoSchema = new Schema<IBasicInfo>({
    full_name: { type: String, required: true, trim: true },
    form_number: { type: Number, required: true },
    due_date: { type: Date },
    submission_disclaimer: { type: String },
    form_description: { type: String },
    measurement_unit: { type: String },
    allow_multiple_submission: { type: Boolean, default: false },
    is_mendatory: { type: Boolean, default: false },
    dependant_form: { 
        type: Schema.Types.ObjectId, 
        ref: 'Form'
    },
    dependant_features: { type: String },
    limit_quantity_for_all: { type: Boolean, default: false },
    payment_collection_required: { type: Boolean, default: false },
    payment_collection_mode: { type: String },
    offline_payment_option: [{ type: String }],
    tds_applicable: { type: Boolean, default: false },
    payment_instructions: { type: String },
    service_provider: [{ type: String }],
    stall_type: { type: String },
    apply_vendor_filter: { type: Boolean, default: false },
    apply_zone_filter: { type: Boolean, default: false },
    submit_without_pay_verify: { type: Boolean, default: false },
    machinery_wbs: { type: String },
    jewllery_wbs: { type: String },
    allow_personal_cctv_installation: { type: Boolean, default: false },
}, { _id: false });


// Media Info Schema
const supportingDocumentSchema = new Schema<ISupportingDocument>({
    name: { type: String, required: true },
    path: { type: String, required: true },
}, { _id: false });

const mediaInfoSchema = new Schema<IMediaInfo>({
    important_instructions_image: { type: String },
    supporting_documents: [supportingDocumentSchema],
}, { _id: false });


// Other Info Schema
const otherInfoSchema = new Schema<IOtherInfo>({
    terms_and_condition: { type: String, required: true },
    ofline_order_summary: { type: String },
}, { _id: false });


// Template mapping inside a notification type
const notificationTemplateSchema = new Schema<INotificationTemplate>({
    typeId: { type: Schema.Types.ObjectId, ref: "TemplateType", required: true },
    templateId: { 
        type: Schema.Types.ObjectId, 
        required: true,
        refPath: 'templates.templateRef'   // <-- dynamic reference
    },
    actionType: { type: String, required: true, trim: true },
    isCustom: { type: Boolean, default: false },
    templateRef: {             // <-- field to tell Mongoose which model to populate
        type: String,
        required: true,
        enum: ['Template', 'UserTemplate'],
        default: 'Template' // Simple default, we'll handle the logic in pre-save
    }
}, { _id: false });

// Add pre-save middleware to set templateRef based on isCustom
notificationTemplateSchema.pre('save', function(next) {
    this.templateRef = this.isCustom ? 'UserTemplate' : 'Template';
    next();
});

// Notification type detail (e.g. emailNotification)
const notificationDetailSchema = new Schema<INotificationDetail>({
    enabled: { type: Boolean, default: false },
    templates: [notificationTemplateSchema],
}, { _id: false });

// Master notifications schema
const notificationsSchema = new Schema<INotifications>({
    emailNotification: { type: notificationDetailSchema, default: () => ({}) },
    smsNotification: { type: notificationDetailSchema, default: () => ({}) },
    whatsappNotification: { type: notificationDetailSchema, default: () => ({}) },
}, { _id: false });


// ----------------------
// MAIN EXHIBITOR FORM SCHEMA
// ----------------------

const exhibitorFormSchema = new Schema<IExhibitorForm>({
    basicInfo: { type: basicInfoSchema, default: {} },
    mediaInfo: { type: mediaInfoSchema, default: {} },
    otherInfo: { type: otherInfoSchema, default: {} },
    notifications: { type: notificationsSchema, default: {} },

    status: { 
        type: String, 
        enum: ['published', 'unpublished'], 
        default: 'unpublished' 
    },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    eventId: { type: Schema.Types.ObjectId, ref: "EventHost" },
    exhibitorFormConfigurationId: { type: Schema.Types.ObjectId, ref: "ExhibitorFormConfiguration" },
}, {
    timestamps: true,
});

// Indexes for better performance
exhibitorFormSchema.index({ eventId: 1, exhibitorFormConfigurationId: 1 }, { unique: true }); // exhibitor form unique for specific event for specific congig type
exhibitorFormSchema.index({ companyId: 1, status: 1 });
exhibitorFormSchema.index({ eventId: 1 });
exhibitorFormSchema.index({ createdAt: -1 });

export default mongoose.model<IExhibitorForm>("ExhibitorForm", exhibitorFormSchema);

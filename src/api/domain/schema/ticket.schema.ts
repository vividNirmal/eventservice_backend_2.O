import mongoose, { Document, Schema } from "mongoose";

export interface IDateSlab {
    startDateTime: Date;
    endDateTime: Date;
    amount: number;
}

export interface IBusinessSlabCategoryAmount {
    category: string;
    amount: number;
}

export interface IBusinessSlab {
    startDateTime: Date;
    endDateTime: Date;
    categoryAmounts: IBusinessSlabCategoryAmount[];
}

export interface ITicketAmount {
    type: 'free' | 'dateSlab' | 'businessSlab';
    currency?: string;
    dateRangeAmounts?: IDateSlab[]; // For dateSlab type
    businessSlabs?: IBusinessSlab[]; // For businessSlab type
    feeSetting?: 'merge' | 'not-merge'; // Common optional fields
    materialNumber?: string;
    wbs?: string;
}

export interface IAdvancedSettings {
    ticketBuyLimitMin: number;
    ticketBuyLimitMax: number;
    hasQuantityLimit: boolean;
    badgeCategory?: string;
    registrationFilterDate?: Date;
    allowCrossRegister: boolean;
    crossRegisterCategories?: string[];
    autoApprovedUser: boolean;
    authenticateByOTP: boolean;
    autoPassword: boolean;
    addAllDiscount: boolean;
    individualDiscount: boolean;
    registrationSuccessMessage?: string;
}

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

export interface ITicket extends Document {
    // Basic Info
    ticketName: string;
    userType: mongoose.Types.ObjectId;
    registrationFormId?: mongoose.Types.ObjectId;
    ticketCategory: string;
    serialNoPrefix: string;
    startCount: number;
    description?: string;

    // Ticket Amount
    ticketAmount: ITicketAmount;

    // Ticket Settings
    ticketPerUser: number;
    ticketAccess: string;
    linkBannerDesktop?: string;
    linkBannerMobile?: string;
    linkLoginBanner?:string;
    desktopBannerImage?: string;
    mobileBannerImage?: string;
    loginBannerImage?: string;
    ctaSettings?: string[];

    // Advanced Settings
    advancedSettings: IAdvancedSettings;

    // Notifications
    notifications: INotifications;

    // System fields
    status: 'active' | 'inactive' | 'expired';
    createdAt: Date;
    updatedAt: Date;
    companyId?: mongoose.Types.ObjectId;
    eventId?: mongoose.Types.ObjectId;
    isActiveForm: boolean;
}

const dateSlabSchema = new Schema<IDateSlab>({
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 }
}, { _id: false });

const businessSlabCategoryAmountSchema = new Schema<IBusinessSlabCategoryAmount>({
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 }
}, { _id: false });

const businessSlabSchema = new Schema<IBusinessSlab>({
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    categoryAmounts: [businessSlabCategoryAmountSchema]
}, { _id: false });

const ticketAmountSchema = new Schema<ITicketAmount>({
    type: {
        type: String,
        enum: ['free', 'dateSlab', 'businessSlab'],
        required: true
    },
    currency: { 
        type: String,
        enum: ['USD', 'INR', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED'],
        required: function () { return this.type !== 'free'; }
    },
    dateRangeAmounts: {
        type: [dateSlabSchema],
        required: function() {
            return this.type === 'dateSlab';
        }
    },
    businessSlabs: {
        type: [businessSlabSchema],
        required: function() {
            return this.type === 'businessSlab';
        }
    },
    feeSetting: {
        type: String,
        enum: ['merge', 'not-merge'],
        default: 'merge'
    },
    materialNumber: { type: String, trim: true },
    wbs: { type: String, trim: true }
}, { _id: false });

// Advanced Settings Subschema
const advancedSettingsSchema = new Schema<IAdvancedSettings>({
    ticketBuyLimitMin: { type: Number, required: true, default: 1, min: 1 },
    ticketBuyLimitMax: { type: Number, required: true, default: 10, min: 1 },
    hasQuantityLimit: { type: Boolean, default: false },
    badgeCategory: { type: String, trim: true },
    registrationFilterDate: { type: Date },
    allowCrossRegister: { type: Boolean, default: false },
    crossRegisterCategories: [{ type: String }],
    autoApprovedUser: { type: Boolean, default: false },
    authenticateByOTP: { type: Boolean, default: false },
    autoPassword: { type: Boolean, default: false },
    addAllDiscount: { type: Boolean, default: false },
    individualDiscount: { type: Boolean, default: false },
    registrationSuccessMessage: { type: String }
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

const ticketSchema: Schema = new Schema<ITicket>({
    // Basic Info
    ticketName: { type: String, required: true, trim: true },
    userType: { type: mongoose.Schema.Types.ObjectId, ref: "UserType", required: true },
    registrationFormId: { type: Schema.Types.ObjectId, ref: "Form" },
    ticketCategory: { 
        type: String, 
        required: true,
        enum: ['Default', 'VIP', 'VVIP', 'Premium', 'Standard']
    },
    serialNoPrefix: { type: String, required: true, trim: true },
    startCount: { type: Number, required: true, default: 0, min: 0 },
    description: { type: String, trim: true },

    // Ticket Amount
    ticketAmount: { type: ticketAmountSchema, required: true, default: () => ({ type: 'free' })},

    // Ticket Settings
    ticketPerUser: { type: Number, required: true, default: 1, min: 1 },
    ticketAccess: { 
        type: String, 
        required: true, 
        enum: ['Open For All', 'Invitation Only', 'Pre-Approved'],
        default: 'Open For All'
    },
    linkBannerDesktop: { type: String, trim: true },
    linkBannerMobile: { type: String, trim: true },
    linkLoginBanner: {type: String, trim: true},
    desktopBannerImage: { type: String, trim: true },
    mobileBannerImage: { type: String, trim: true },
    loginBannerImage : { type: String, trim: true },
    ctaSettings: [{
        type: String,
        enum: ['Chat', 'Schedule']
    }],

    // Advanced Settings
    advancedSettings: { type: advancedSettingsSchema, default: {} },

    // Notifications
    notifications: { type: notificationsSchema, default: {} },

    // System fields
    status: { 
        type: String, 
        enum: ['active', 'inactive', 'expired'], 
        default: 'active' 
    },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    eventId: { type: Schema.Types.ObjectId, ref: "EventHost" },
    isActiveForm: { type: Boolean, default: false },
}, {
    timestamps: true,
});

// Indexes for better performance
ticketSchema.index({ companyId: 1, status: 1 });
ticketSchema.index({ userType: 1 });
ticketSchema.index({ ticketCategory: 1 });
ticketSchema.index({ eventId: 1, userType: 1 });
ticketSchema.index({ createdAt: -1 });

export default mongoose.model<ITicket>("Ticket", ticketSchema);

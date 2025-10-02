import mongoose, { Document, Schema } from "mongoose";

export interface ISlotAmount {
    startDateTime: Date;
    endDateTime: Date;
    amount: number;
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
}

export interface INotifications {
    emailNotification: boolean;
    smsNotification: boolean;
    whatsappNotification: boolean;
}

export interface ITicket extends Document {
    // Basic Info
    ticketName: string;
    userType: string;
    registrationFormId?: mongoose.Types.ObjectId;
    ticketCategory: string;
    serialNoPrefix: string;
    startCount: number;
    description?: string;

    // Ticket Amount
    isFree: boolean;
    currency?: string;
    slotAmounts?: ISlotAmount[];
    feeSetting?: 'merge' | 'not-merge';
    materialNumber?: string;
    wbs?: string;

    // Ticket Settings
    ticketPerUser: number;
    ticketAccess: string;
    linkBannerDesktop?: string;
    linkBannerMobile?: string;
    desktopBannerImage?: string;
    mobileBannerImage?: string;
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
}

const slotAmountSchema = new Schema<ISlotAmount>({
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 }
});

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
}, { _id: false });

// Notifications Subschema
const notificationsSchema = new Schema<INotifications>({
    emailNotification: { type: Boolean, default: false },
    smsNotification: { type: Boolean, default: false },
    whatsappNotification: { type: Boolean, default: false },
}, { _id: false });

const ticketSchema: Schema = new Schema<ITicket>({
    // Basic Info
    ticketName: { type: String, required: true, trim: true },
    userType: { 
        type: String, 
        required: true,
        enum: ['Event Attendee', 'Exhibiting Company', 'Sponsor', 'Speaker', 'Service Provider', 'Accompanying']
    },
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
    isFree: { type: Boolean, required: true, default: false },
    currency: { 
        type: String,
        enum: ['USD', 'INR', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED'],
        required: function() { return !this.isFree; }
    },
    slotAmounts: [slotAmountSchema],
    feeSetting: { 
        type: String, 
        enum: ['merge', 'not-merge'],
        required: function() { return !this.isFree; }
    },
    materialNumber: { type: String, trim: true },
    wbs: { type: String, trim: true },

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
    desktopBannerImage: { type: String, trim: true },
    mobileBannerImage: { type: String, trim: true },
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
    eventId: { type: Schema.Types.ObjectId, ref: "EventHost" }
}, {
    timestamps: true,
});

// Indexes for better performance
ticketSchema.index({ companyId: 1, status: 1 });
ticketSchema.index({ userType: 1 });
ticketSchema.index({ ticketCategory: 1 });
ticketSchema.index({ createdAt: -1 });

export default mongoose.model<ITicket>("Ticket", ticketSchema);

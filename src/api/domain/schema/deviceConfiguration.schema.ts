import mongoose, { Document, Schema } from "mongoose";

export interface IDeviceConfigurationSchema extends Document {
    scanner_machine_id: string;
    company_id: string;
    event_id: string;
    scanner_name: string;
    scanner_unique_id: string;
    device_type: string; // "0" for Check In, "1" for Check Out
    entry_mode: string; // "0" for Check In, "1" for Check Out
    device_key: string;
    location_name: string;
    check_in_area: string;
    check_in_by: string; // "reg_no", "regno_invitation"
    device_access: string; // "user", "admin", "all"
    badge_category: string; // "vip", "general", "staff", "speaker", "sponsor", "all"
    comment?: string;
    status: string;
}

const deviceConfigurationSchema: Schema = new Schema<IDeviceConfigurationSchema>({
    scanner_machine_id: { type: String, required: true },
    company_id: { type: String, required: true },
    event_id: { type: String, required: true },
    scanner_name: { type: String, required: true },
    scanner_unique_id: { type: String, required: true },
    device_type: { type: String, required: true, enum: ["0", "1"] }, // 0 = Check In, 1 = Check Out
    entry_mode: { type: String, required: true, enum: ["0", "1"] }, // 0 = Check In, 1 = Check Out
    device_key: { type: String, required: true },
    location_name: { type: String, required: true },
    check_in_area: { type: String, required: true },
    check_in_by: { type: String, required: true, enum: ["reg_no", "regno_invitation"] },
    device_access: { type: String, required: false, enum: ["user", "admin", "all"], default: "all" },
    badge_category: { type: String, required: false, enum: ["vip", "general", "staff", "speaker", "sponsor", "all"], default: "all" },
    comment: { type: String, required: false },
    status: { type: String, required: false, default: "1" },
},
{
    timestamps: true,
});

// Create compound index for unique device configuration per company and event
deviceConfigurationSchema.index({ 
    company_id: 1, 
    event_id: 1, 
    device_key: 1 
}, { unique: true });

export default mongoose.model<IDeviceConfigurationSchema>("DeviceConfiguration", deviceConfigurationSchema);
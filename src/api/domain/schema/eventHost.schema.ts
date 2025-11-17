import mongoose, { Document, Schema } from "mongoose";

export interface IDateRange {
  startDate: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  endDate: string;   // YYYY-MM-DD format
  endTime: string;   // HH:mm format
}

// Enum for event entry/exit device types
export enum EventEntryExitDevice {
  FACE_SCAN = "Face Scan",
  QR = "QR",
  FACE_SCANNER_QR = "Face Scanner + QR",  
}

// Enum for instant register options
export enum InstantRegisterOption {
  NAME_NUMBER_ONLY = "Name and Number Entry Only",
  NAME_NUMBER_FACE = "Name, Number and Face"
}

export interface IEventHost extends Document {
  eventName: string;
  eventShortName: string;
  eventTimeZone: string;
  startDate: string; // YYYY-MM-DD format (kept for backward compatibility)
  startTime: string; // HH:mm format (kept for backward compatibility)
  endDate: string;   // YYYY-MM-DD format (kept for backward compatibility)
  endTime: string;   // HH:mm format (kept for backward compatibility)
  dateRanges: IDateRange[]; // New field for multiple date ranges
  eventCategory: string[];
  event_category: mongoose.Types.ObjectId;
  location: string;  
  company_id?: string;
  company_name?: string;
  event_title?: string;
  event_slug?: string;
  event_description?: string;
  start_date?: string[];
  end_date?: string[];
  google_map_url?: string;
  address?: string;
  event_type?: string;
  eventType?: string;
  event_logo?: string;
  event_image?: string;
  show_location_image?: string;
  event_sponsor?: string;
  organizer_name?: string;
  organizer_email?: string;
  organizer_phone?: string;
  with_face_scanner?: number;
  selected_form_id?: string;
  ticketId?: string;
  participant_capacity?: number;
  event_entry_exit_device?: EventEntryExitDevice[]; // Array of entry/exit devices
  instant_register?: InstantRegisterOption[]; // New field for instant register option
  createdAt: Date;
  updatedAt: Date;
}

const eventHostSchema: Schema = new Schema<IEventHost>(
  {
    eventName: { type: String, required: true },
    eventShortName: { type: String, required: true },
    eventTimeZone: { type: String },
    startDate: { type: String },
    startTime: { type: String },
    endDate: { type: String },
    endTime: { type: String },
    dateRanges: [{
      startDate: { type: String, required: true },
      startTime: { type: String, required: true },
      endDate: { type: String, required: true },
      endTime: { type: String, required: true }
    }],
    eventCategory: { type: [String] },
    location: { type: String },
    // Additional event details fields
    company_id: { type: String, required: true, index: true },
    company_name: { type: String },
    event_title: { type: String },
    event_slug: { type: String, unique: true, sparse: true },
    event_description: { type: String },
    start_date: { type: [String] },
    end_date: { type: [String] },
    google_map_url: { type: String },
    address: { type: String },
    event_type: { type: String },
    eventType: { type: String },
    event_logo: { type: String },
    event_image: { type: String },
    show_location_image: { type: String },
    event_sponsor: { type: String },
    organizer_name: { type: String },
    organizer_email: { type: String },
    organizer_phone: { type: String },
    with_face_scanner: { type: Number, default: 0 },
    selected_form_id: { type: String },
    ticketId: { type: String },
    participant_capacity: { type: Number, default: 1000 },
    event_category: { type: Schema.Types.ObjectId, ref: 'EventCategory' },
    event_entry_exit_device: [{
      type: String,
      enum: Object.values(EventEntryExitDevice)
    }],
    instant_register:[{
      type: String,
      enum: Object.values(InstantRegisterOption)
    }]
  },
  {
    timestamps: true, // Automatically handles createdAt and updatedAt
  }
);

export default mongoose.model<IEventHost>("EventHost", eventHostSchema);
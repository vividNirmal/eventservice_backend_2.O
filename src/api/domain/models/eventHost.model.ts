import { convertToSlug } from "../../helper/helper";
import eventHostSchema from "../schema/eventHost.schema";
import { env } from "../../../infrastructure/env";

interface DateRange {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

interface EventHostData {
  eventName: string;
  eventShortName: string;
  eventTimeZone: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  dateRanges?: DateRange[]; // New field for multiple date ranges
  eventType: string;
  eventCategory: string[];
  location: string;
  // Additional event details fields
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
  event_id?: any;
  event_category: any;
  instant_register: string[];
  event_entry_exit_device: string[];
}

interface LoginUserData {
  user_id: string;
  company_id: string;
}

// Create Event Host
export const storeEventHost = async (
  loginUserData: LoginUserData,
  eventData: EventHostData,
  callback: (error: any, result: any) => void
) => {
  try {
    // Handle dateRanges - use either new dateRanges field or legacy single date/time
    let dateRanges = eventData.dateRanges || [];

    // If no dateRanges provided but we have legacy startDate/endDate, create a single range
    if (
      dateRanges.length === 0 &&
      eventData.startDate &&
      eventData.startTime &&
      eventData.endDate &&
      eventData.endTime
    ) {
      dateRanges = [
        {
          startDate: eventData.startDate,
          startTime: eventData.startTime,
          endDate: eventData.endDate,
          endTime: eventData.endTime,
        },
      ];
    }

    // Process event_entry_exit_device to ensure it's an array
    let entryExitDevices: string[] = [];
    if (eventData.event_entry_exit_device) {
      if (Array.isArray(eventData.event_entry_exit_device)) {
        entryExitDevices = eventData.event_entry_exit_device;
      } else {
        entryExitDevices = [eventData.event_entry_exit_device];
      }
    }

    // Process instant_register to ensure it's a string

    let instantRegister: string[] = [];
    if (eventData.instant_register) {
      if (Array.isArray(eventData.instant_register)) {
        instantRegister = eventData.instant_register;
      } else {
        instantRegister = [eventData.instant_register];
      }
    }

    const newEventHost = new eventHostSchema({
      eventName: eventData.eventName,
      eventShortName: eventData.eventShortName,
      eventTimeZone: eventData.eventTimeZone,
      startDate:
        eventData.startDate ||
        (dateRanges.length > 0 ? dateRanges[0].startDate : ""),
      startTime:
        eventData.startTime ||
        (dateRanges.length > 0 ? dateRanges[0].startTime : ""),
      endDate:
        eventData.endDate ||
        (dateRanges.length > 0 ? dateRanges[0].endDate : ""),
      endTime:
        eventData.endTime ||
        (dateRanges.length > 0 ? dateRanges[0].endTime : ""),
      dateRanges: dateRanges,
      eventType: eventData.eventType,
      eventCategory: eventData.eventCategory,
      location: eventData.location,
      // Additional event details fields (with defaults for optional fields)
      company_id: eventData?.company_id, // Store company_id from login user
      company_name: eventData.company_name || "",
      event_title: eventData.event_title || eventData.eventName,
      event_slug:
        eventData.event_slug ||
        convertToSlug(eventData.eventName + "-" + Date.now()),
      event_description: eventData.event_description || "",
      start_date: eventData.start_date || [],
      end_date: eventData.end_date || [],
      google_map_url: eventData.google_map_url || "",
      address: eventData.address || "",
      event_type: eventData.event_type || eventData.eventType,
      event_logo: eventData.event_logo || "",
      event_image: eventData.event_image || "",
      show_location_image: eventData.show_location_image || "",
      event_sponsor: eventData.event_sponsor || "",
      organizer_name: eventData.organizer_name || "",
      organizer_email: eventData.organizer_email || "",
      organizer_phone: eventData.organizer_phone || "",
      with_face_scanner: eventData.with_face_scanner || 0,
      selected_form_id: eventData.selected_form_id || null,
      ticketId: eventData.ticketId || null,
      event_category: eventData.event_category || null,
      event_entry_exit_device: entryExitDevices,
      instant_register: instantRegister,
    });

    const savedEvent = await newEventHost.save();
    return callback(null, { eventId: savedEvent._id });
  } catch (error) {
    
    return callback(error, null);
  }
};

// Update Event Host
export const updateEventHost = async (
  eventData: EventHostData,
  callback: (error: any, result: any) => void
) => {
  try {
    const eventId = eventData.event_id;

    // Build update object with only provided fields
    const updateFields: any = {};

    // Handle dateRanges - use either new dateRanges field or legacy single date/time
    let dateRanges = eventData.dateRanges || [];

    // If no dateRanges provided but we have legacy startDate/endDate, create a single range
    if (
      dateRanges.length === 0 &&
      eventData.startDate &&
      eventData.startTime &&
      eventData.endDate &&
      eventData.endTime
    ) {
      dateRanges = [
        {
          startDate: eventData.startDate,
          startTime: eventData.startTime,
          endDate: eventData.endDate,
          endTime: eventData.endTime,
        },
      ];
    }

    // Basic event fields
    if (eventData.eventName) updateFields.eventName = eventData.eventName;
    if (eventData.eventShortName)
      updateFields.eventShortName = eventData.eventShortName;
    if (eventData.eventTimeZone)
      updateFields.eventTimeZone = eventData.eventTimeZone;

    // Update date fields - use dateRanges if available, otherwise use legacy fields
    if (dateRanges.length > 0) {
      updateFields.dateRanges = dateRanges;
      updateFields.startDate = dateRanges[0].startDate;
      updateFields.startTime = dateRanges[0].startTime;
      updateFields.endDate = dateRanges[0].endDate;
      updateFields.endTime = dateRanges[0].endTime;
    } else {
      if (eventData.startDate) updateFields.startDate = eventData.startDate;
      if (eventData.startTime) updateFields.startTime = eventData.startTime;
      if (eventData.endDate) updateFields.endDate = eventData.endDate;
      if (eventData.endTime) updateFields.endTime = eventData.endTime;
    }

    if (eventData.eventType) updateFields.eventType = eventData.eventType;
    if (eventData.eventCategory)
      updateFields.eventCategory = eventData.eventCategory;
    if (eventData.location) updateFields.location = eventData.location;

    // Additional event details fields
    if (eventData.company_id) updateFields.company_id = eventData.company_id;
    if (eventData.company_name)
      updateFields.company_name = eventData.company_name;
    if (eventData.event_title) updateFields.event_title = eventData.event_title;
    if (eventData.event_slug) updateFields.event_slug = eventData.event_slug;
    if (eventData.event_description)
      updateFields.event_description = eventData.event_description;
    if (eventData.start_date) updateFields.start_date = eventData.start_date;
    if (eventData.end_date) updateFields.end_date = eventData.end_date;
    if (eventData.google_map_url)
      updateFields.google_map_url = eventData.google_map_url;
    if (eventData.address) updateFields.address = eventData.address;
    if (eventData.event_type) updateFields.event_type = eventData.event_type;
    if (eventData.organizer_name)
      updateFields.organizer_name = eventData.organizer_name;
    if (eventData.organizer_email)
      updateFields.organizer_email = eventData.organizer_email;
    if (eventData.organizer_phone)
      updateFields.organizer_phone = eventData.organizer_phone;
    if (eventData.with_face_scanner !== undefined)
      updateFields.with_face_scanner = eventData.with_face_scanner;
    if (eventData.selected_form_id)
      updateFields.selected_form_id = eventData.selected_form_id;

    const baseUrl = env.BASE_URL;
    // Only update image fields if new images are provided
    if (eventData.event_logo) {
      updateFields.event_logo = `${baseUrl}/uploads/${eventData.event_logo}`;
    }
    if (eventData.event_image) {
      updateFields.event_image = `${baseUrl}/uploads/${eventData.event_image}`;
    }
    if (eventData.show_location_image) {
      updateFields.show_location_image = `${baseUrl}/uploads/${eventData.show_location_image}`;
    }
    if (eventData.event_sponsor) {
      updateFields.event_sponsor = `${baseUrl}/uploads/${eventData.event_sponsor}`;
    }
    if (eventData.event_category)
      updateFields.event_category = eventData.event_category;

    // Handle event_entry_exit_device
    if (eventData.event_entry_exit_device !== undefined) {
      if (Array.isArray(eventData.event_entry_exit_device)) {
        updateFields.event_entry_exit_device =
          eventData.event_entry_exit_device;
      } else if (eventData.event_entry_exit_device) {
        updateFields.event_entry_exit_device = [
          eventData.event_entry_exit_device,
        ];
      } else {
        updateFields.event_entry_exit_device = [];
      }
    }

    if (eventData.instant_register !== undefined) {
      if (Array.isArray(eventData.instant_register)) {
        updateFields.instant_register = eventData.instant_register;
      } else if (eventData.instant_register) {
        updateFields.instant_register = [eventData.instant_register];
      } else {
        updateFields.instant_register = [];
      }
    }

    const updatedEvent = await eventHostSchema.findByIdAndUpdate(
      eventId,
      updateFields,
      { new: true }
    );

    if (!updatedEvent) {
      return callback(new Error("Event not found or update failed."), null);
    }

    
    return callback(null, { updatedEvent });
  } catch (error) {    
    return callback(error, null);
  }
};

// Admin Event Host List
export const adminEventHostList = async (
  loginUserData: LoginUserData,
  page: number,
  pageSize: number,
  searchQuery: string,
  callback: (error: any, result: any) => void
) => {
  try {
    const currentPage = page || 1;
    const size = pageSize || 10;
    const skip = (currentPage - 1) * size;

    const searchFilter = searchQuery
      ? {
          $or: [
            { eventName: { $regex: searchQuery, $options: "i" } },
            { eventShortName: { $regex: searchQuery, $options: "i" } },
            { eventType: { $regex: searchQuery, $options: "i" } },
          ],
        }
      : {};

    const events = await eventHostSchema
      .find(searchFilter)
      .skip(skip)
      .limit(size)
      .populate("event_category");

    const totalEvents = await eventHostSchema.countDocuments(searchFilter);

    const result = {
      currentPage,
      totalPages: Math.ceil(totalEvents / size),
      totalEvents,
      events,
    };

    return callback(null, result);
  } catch (error) {
    return callback(error, null);
  }
};

// Admin Event Host List By Company
export const getAdminEventHostListByCompany = async (
  loginUserData: LoginUserData,
  companyId: string,
  page: number,
  pageSize: number,
  searchQuery: string,
  callback: (error: any, result: any) => void
) => {
  try {
    const currentPage = page || 1;
    const size = pageSize || 10;
    const skip = (currentPage - 1) * size;
    const searchFilter = searchQuery
      ? {
          $and: [
            { company_id: companyId },
            {
              $or: [
                { eventName: { $regex: searchQuery, $options: "i" } },
                { eventShortName: { $regex: searchQuery, $options: "i" } },
                { eventType: { $regex: searchQuery, $options: "i" } },
              ],
            },
          ],
        }
      : { company_id: companyId };

    const events = await eventHostSchema
      .find(searchFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(size)
      .populate("event_category");

    const totalEvents = await eventHostSchema.countDocuments(searchFilter);

    const result = {
      currentPage,
      totalPages: Math.ceil(totalEvents / size),
      totalEvents,
      events,
    };

    return callback(null, result);
  } catch (error) {
    return callback(error, null);
  }
};

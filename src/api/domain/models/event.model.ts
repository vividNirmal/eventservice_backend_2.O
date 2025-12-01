import { convertToSlug } from "../../helper/helper";
import eventSchema from "../schema/event.schema";
import reasonSchema from "../schema/RFV.schema";
import companyActivitySchema from "../schema/companyActivity.schema";
import { env } from "../../../infrastructure/env";
import multer from "multer"
import path from "path"
import eventHostSchema from "../schema/eventHost.schema";

import formRegistrationSchema from "../schema/formRegistration.schema";

interface eventData{
    company_name: string;
    event_title: string;
    event_slug: string;
    event_description: string;
    start_date: string[];
    end_date: string[];
    google_map_url: string;
    address:string,
    event_type:string,
    event_logo:string,
    event_image:string,
    event_sponsor:string,
    organizer_name:string,
    organizer_email:string,
    with_face_scanner:number
    organizer_phone:string,
    sort_des_about_event:string,
    reason_for_visiting:string[],
    company_activity:string[],
    event_id?: any,
    show_location_image?:string,
    getting_show_location?:string,
    company_id?:string,
}

interface ExtraEventData{
    company_activity:string[],
    event_id?: any,
    sort_des_about_event:string,
    reason_for_visiting:string[],
}
interface eventVisitReason{
    event_id : any;
    reason : string[];
}

interface companyActivity{
    event_id : any;
    reason : string[];
}

interface loginUserData{
    user_id:string;
    company_id:string;
}

export const storeEvent = async (loginUserData:loginUserData,eventData: eventData, callback: (error: any, result: any) => void) => {
    try {
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, './uploads');
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, uniqueSuffix + path.extname(file.originalname));
            },
        });
        console.log(loginUserData.company_id);
        const newEvent = new eventSchema({
            company_id:loginUserData.company_id,
            company_name: eventData.company_name,
            event_title: eventData.event_title,
            event_slug: convertToSlug(eventData.event_slug),
            event_description: eventData.event_description,
            start_date: eventData.start_date,
            end_date: eventData.end_date,
            google_map_url: eventData.google_map_url,
            address: eventData.address,
            event_type: eventData.event_type,
            event_logo: eventData.event_logo,
            event_image: eventData.event_image,
            event_sponsor: eventData.event_sponsor,
            with_face_scanner : eventData.with_face_scanner,
            show_location_image: eventData.show_location_image,
            getting_show_location: eventData.getting_show_location,
            organizer_name: eventData.organizer_name,
            organizer_email: eventData.organizer_email,
            organizer_phone: eventData.organizer_phone,
            sort_des_about_event: eventData.sort_des_about_event,
        });

        const savedEvent = await newEvent.save();
        const eventId = savedEvent._id;

        // const [visitReasonResult, companyActivityResult] = await Promise.all([
        //     new Promise((resolve, reject) => {
        //         storeEventVisitReason({ event_id: eventId, reason: eventData.reason_for_visiting }, (error, result) => {
        //             if (error) return reject(error);
        //             resolve(result);
        //         });
        //     }),
        //     new Promise((resolve, reject) => {
        //         storeCompanyActivity({ event_id: eventId, reason: eventData.company_activity }, (error, result) => {
        //             if (error) return reject(error);
        //             resolve(result);
        //         });
        //     }),
        // ]);

        return callback(null, { eventId });
    } catch (error) {
        return callback(error, null); 
    }
};

export const updateEvent = async (eventData: eventData, callback: (error: any, result: any) => void) => {
    try {
        const eventId = eventData.event_id; 
        const existingEventWithSlug = await eventSchema.findOne({
            event_slug: convertToSlug(eventData.event_slug),
            _id: { $ne: eventId }, 
        });
        
        if (existingEventWithSlug) {
            return callback(new Error("The event_slug is already in use by another event."), null);
        }
        
        const updatedEvent = await eventSchema.findByIdAndUpdate(
            eventId,
            {
                company_name: eventData.company_name,
                event_title: eventData.event_title,
                event_slug: convertToSlug(eventData.event_slug),
                event_description: eventData.event_description,
                start_date: eventData.start_date,
                end_date: eventData.end_date,
                google_map_url: eventData.google_map_url,
                address: eventData.address,
                event_type: eventData.event_type,
                event_logo: eventData.event_logo,
                event_image: eventData.event_image,
                event_sponsor: eventData.event_sponsor,
                with_face_scanner : eventData.with_face_scanner,
                show_location_image: eventData.show_location_image,
                organizer_name: eventData.organizer_name,
                organizer_email: eventData.organizer_email,
                organizer_phone: eventData.organizer_phone,
                getting_show_location: eventData.getting_show_location,
                sort_des_about_event: eventData.sort_des_about_event,
            },
            { new: true } 
        );

        if (!updatedEvent) {
            return callback(new Error("Event not found or update failed."), null);
        }
        // const reasonDeleteResult = await reasonSchema.deleteMany({ event_id: eventId });
        // const companyActivityDeleteResult = await companyActivitySchema.deleteMany({ event_id: eventId });

        // const [visitReasonResult, companyActivityResult] = await Promise.all([
        //     new Promise((resolve, reject) => {
        //         storeEventVisitReason({ event_id: eventId, reason: eventData.reason_for_visiting }, (error, result) => {
        //             if (error) return reject(error);
        //             resolve(result);
        //         });
        //     }),
        //     new Promise((resolve, reject) => {
        //         storeCompanyActivity({ event_id: eventId, reason: eventData.company_activity }, (error, result) => {
        //             if (error) return reject(error);
        //             resolve(result);
        //         });
        //     }),
        // ]);

        return callback(null, {
            updatedEvent
        });
    } catch (error) {
        return callback(error, null);
    }
};

export const storeEventVisitReason = async (
    eventVisitReason: eventVisitReason,
    callback: (error: any, result: any) => void
) => {
    try {
        const savedReasons = [];
        for (const visitReason of eventVisitReason.reason) {
            const newReason = new reasonSchema({
                event_id: eventVisitReason.event_id,
                reason: visitReason, 
            });

            const savedReason = await newReason.save();
            savedReasons.push(savedReason);
        }

        return callback(null, savedReasons);
    } catch (error) {
        return callback(error, null);
    }
};

export const storeCompanyActivity = async (
    companyActivity: companyActivity,
    callback: (error: any, result: any) => void
) => {
    try {
       
        const savedReasons = [];
        for (const activityReason of companyActivity.reason) {
            const newReason = new companyActivitySchema({
                event_id: companyActivity.event_id,
                company_activity: activityReason, 
            });

            const savedReason = await newReason.save();
            savedReasons.push(savedReason);
        }

        return callback(null, savedReasons);
    } catch (error) {
        return callback(error, null);
    }
};

export const adminEventList = async (loginUserData:loginUserData,userData: eventData, page: number, pageSize: number, searchQuery: string, callback: (error: any, result: any) => void) => {
    try {
        console.log(loginUserData.company_id);
        const currentPage = page || 1;
        const size = pageSize || 10;

        const skip = (currentPage - 1) * size;

        const searchFilter = searchQuery
            ? {
                  $or: [
                      { company_name: { $regex: searchQuery, $options: 'i' } }, 
                      { event_title: { $regex: searchQuery, $options: 'i' } }, 
                      { event_slug: { $regex: searchQuery, $options: 'i' } }, 
                      { address: { $regex: searchQuery, $options: 'i' } }, 
                    ],
                    company_id: loginUserData.company_id
                }
              : { company_id: loginUserData.company_id };

        const events = await eventSchema.find(searchFilter).skip(skip).limit(size);
        
        const eventswithimage = events.map(event => {
            return {
                ...event.toObject(), 
                event_logo: `${env.BASE_URL}/${event.event_logo}`,
                event_image: `${env.BASE_URL}/${event.event_image}`,
                show_location_image : `${env.BASE_URL}/${event.show_location_image}`,
                event_sponsor:`${env.BASE_URL}/${event.event_sponsor}`,
            };
        });
        const totalUsers = await eventSchema.countDocuments(searchFilter); 
        const result = {
            currentPage: currentPage,
            totalPages: Math.ceil(totalUsers / size),
            totalUsers: totalUsers,
            event: eventswithimage,
        };

        return callback(null, result);
    } catch (error) {
        return callback(error, null);
    }
}

export const getAllEventParticipantUserListModal = async (
  loginUserData: any,
  filters: any,
  pagination: any,
  event_id: any,
  startDate: any,
  endDate: any,
  callback: (error: any, result: any) => void
) => {
  try {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    if (!event_id) {
      return callback({ message: "Event ID is required" }, null);
    }

    // ✅ Validate event
    const event = await eventHostSchema.findById(event_id).lean();
    if (!event) {
      return callback({ message: "Event not found" }, null);
    }

    // ✅ Base filter - only users who have checked in at least once
    const filter: any = { 
      eventId: event_id,
      checkin_time: { $exists: true, $ne: null }  // Only users with check-in time
    };

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // 🔍 Optional search filter
    if (filters && filters.trim() !== "") {
      const searchRegex = { $regex: filters, $options: "i" };
      filter.$or = [
        { email: searchRegex },
        { badgeNo: searchRegex },
        { "formData.name": searchRegex },
        { "formData.first_name": searchRegex },
        { "formData.last_name": searchRegex },
        { "formData.phone_number": searchRegex },
      ];
    }

    // 🧮 Count total
    const totalCount = await formRegistrationSchema.countDocuments(filter);

    // 📋 Fetch data
    const registrations = await formRegistrationSchema
      .find(filter)
      .populate({
        path: "ticketId",
        select: "ticketName registrationFormId userType",
        populate: [
          { path: "registrationFormId", select: ["formName", 'pages'] },
          { path: "userType", select: "typeName" },
        ],
        strictPopulate: false,
      })
      .populate("eventId", "event_title event_slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // ✅ Add userType name directly
    registrations.forEach((r: any) => {
      // Extract userType name directly
      r.userType = r.ticketId?.userType?.typeName || "N/A";
      
      // Get registration form from ticketId
      const registrationForm = r.ticketId?.registrationFormId;
      
      if (registrationForm) {
        // Build map_array from form pages and elements
        const map_array: Record<string, string> = {};
        
        if (Array.isArray(registrationForm.pages)) {
          registrationForm.pages.forEach((page: any) => {
            if (Array.isArray(page.elements)) {
              page.elements.forEach((element: any) => {
                if (element.mapField && element.fieldName) {
                  map_array[element.mapField] = element.fieldName;
                }
              });
            }
          });
        }    
        
        r.registrationFormId = {
          ...registrationForm,
          map_array,
        };
      } else {
        r.registrationFormId = null;
      }
    });

    // ✅ Return same as getFormRegistrationListModel
    return callback(null, {
      registrations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalData: totalCount,
        limit,
      },
    });
  } catch (error) {
    console.error("❌ Error in getAllEventParticipantUserListModal:", error);
    return callback({ message: "An error occurred", error }, null);
  }
};

export const updateEventExtraDetails = async (ExtraEventData: ExtraEventData, callback: (error: any, result: any) => void) => {
    try {
       
        const eventId = ExtraEventData.event_id
        console.log(eventId);
        const updatedEvent = await eventSchema.findByIdAndUpdate(
            eventId,
            {
                sort_des_about_event: ExtraEventData.sort_des_about_event,
            },
            { new: true } 
        );

        if (!updatedEvent) {
            return callback(new Error("Event not found or update failed."), null);
        }
        const reasonDeleteResult = await reasonSchema.deleteMany({ event_id: eventId });
        const companyActivityDeleteResult = await companyActivitySchema.deleteMany({ event_id: eventId });
        const [visitReasonResult, companyActivityResult] = await Promise.all([
            new Promise((resolve, reject) => {
                storeEventVisitReason({ event_id: eventId, reason: ExtraEventData.reason_for_visiting }, (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                });
            }),
            new Promise((resolve, reject) => {
                storeCompanyActivity({ event_id: eventId, reason: ExtraEventData.company_activity }, (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                });
            }),
        ]);
        return callback(null, { ExtraEventData });
        
    } catch (error) {
        return callback(error, null); 
    }
};
import { convertToSlug } from "../../helper/helper";
import eventSchema from "../schema/event.schema";
import reasonSchema from "../schema/RFV.schema";
import companyActivitySchema from "../schema/companyActivity.schema";
import EventParticipantSchema from "../schema/eventParticipant";
import ParticipantSchema from "../schema/participantUsers.schema";
import { env } from "../../../infrastructure/env";
import multer from "multer"
import path from "path"
import QRCode from "qrcode";
import { cryptoService } from "../../services/cryptoService";
import eventHostSchema from "../schema/eventHost.schema";
import ticketSchema from "../schema/ticket.schema";

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

export const getEventTokenDetails = async(encode_string: string, callback: (error: any, result: any) => void) => {
    let callbackCalled = false;
    
    const safeCallback = (error: any, result: any) => {
        if (callbackCalled) {
            console.log('⚠️ Attempted to call callback multiple times - prevented');
            return;
        }
        callbackCalled = true;
        console.log('📞 Calling callback with:', { error: !!error, result: !!result });
        callback(error, result);
    };

    try {
        const baseUrl = env.BASE_URL;
        const key = env.ENCRYPT_KEY;
        const iv = env.DECRYPT_KEY; 
        const decoded = encode_string;
        console.log('🔐key:', key, '🔐iv:', iv);
        console.log('🔐 Decrypting token:', decoded);
        const decrypted = cryptoService.decryptCombinedValue(decoded, key, iv);
        console.log('🔓 Decrypted data:', decrypted);
        
        const slug = decrypted.slug
        const user_token = decrypted.token;
        console.log('🏷️ Event slug:', slug);
        console.log('🎫 User token:', user_token);
        
        const EventParticipantData = await EventParticipantSchema.findOne({ token: user_token });
        console.log('👤 Existing participant data:', EventParticipantData ? 'Found' : 'Not found');
        
        // if (!EventParticipantData) {
            console.log('🔍 Looking for event with slug:', slug);
            const event = await eventHostSchema.findOne({ event_slug: slug }).select('+event_logo +event_image +show_location_image');
            console.log('🎪 Event found:', event ? {
                id: event._id,
                title: event.event_title,
                slug: event.event_slug,
                withFaceScanner: event.with_face_scanner
            } : 'NULL');
            
            if (!event) {
                console.warn('⚠️ No event found with slug:', slug);
                // Let's also try to find any events to see what slugs exist
                const allEvents = await eventHostSchema.find({}, 'event_slug event_title').limit(5);
                console.log('📋 Available event slugs:', allEvents.map(e => ({ slug: e.event_slug, title: e.event_title })));
            }
            
            if (event?.event_logo) {
                event.event_logo = baseUrl +'/'+ event.event_logo;

            }
        
            if (event?.event_image) {
                event.event_image = baseUrl +'/'+ event.event_image;
            }

            if (event?.show_location_image) {
                event.show_location_image = baseUrl +'/'+ event.show_location_image;
            }

            if (event?.event_sponsor) {
                event.event_sponsor = baseUrl +'/'+ event.event_sponsor;
            }

            const company_visit = await companyActivitySchema.find({ event_id: event ? event._id : 0 });
            const visitReason = await reasonSchema.find({ event_id: event ? event._id : 0  });
            let show_form = true;
            const result = {show_form,event,user_token,slug,company_visit,visitReason}
            console.log('✅ Returning result:', {
                show_form,
                event: event ? 'Present' : 'NULL',
                user_token,
                slug,
                company_visit: company_visit.length,
                visitReason: visitReason.length
            });
            return safeCallback(null, result);

        // } else {

        //     let show_form = false;
        //     const event = await eventSchema.findOne({ event_slug: slug }).select('+event_logo +event_image +show_location_image');
        //     if (event?.event_logo) {
        //         event.event_logo = baseUrl +'/'+ event.event_logo;
        //     }
        
        //     if (event?.event_image) {
        //         event.event_image = baseUrl +'/'+event.event_image;
        //     }
        //     if (event?.show_location_image) {
        //         event.show_location_image = baseUrl +'/'+event.show_location_image;
        //     }
        //     if (event?.event_sponsor) {
        //         event.event_sponsor = baseUrl +'/'+ event.event_sponsor;
        //     }
        //     const participantUser = await ParticipantSchema.findOne({ _id: EventParticipantData?.participant_user_id });
            
        //     const participant_qr_details = JSON.stringify({
        //         name: (participantUser?.dynamic_fields?.first_name || participantUser?.dynamic_fields?.name || '') + " " + (participantUser?.dynamic_fields?.last_name || ''),
        //         email: participantUser?.dynamic_fields?.email || participantUser?.dynamic_fields?.email_address,
        //         contact_no: participantUser?.dynamic_fields?.contact || participantUser?.dynamic_fields?.phone_number,
        //         event: event?.event_title,
        //         event_address: event?.address,
        //     });

        //     const base64Image = await QRCode.toDataURL(participant_qr_details);
            
        //     // Format dates for frontend compatibility
        //     let formattedDates = {};
        //     if (event?.start_date && event?.start_date.length > 0) {
        //         const startDate = new Date(event.start_date[0]);
        //         const endDate = event?.end_date && event.end_date.length > 0 
        //           ? new Date(event.end_date[0]) 
        //           : startDate;
                  
        //         formattedDates = {
        //             startDate: startDate.toLocaleDateString("en-US", {
        //                 day: "numeric",
        //                 month: "long",
        //                 year: "numeric",
        //             }),
        //             startTime: startDate.toLocaleTimeString("en-US", {
        //                 hour: "numeric",
        //                 minute: "2-digit",
        //                 hour12: true,
        //             }),
        //             endDate: endDate.toLocaleDateString("en-US", {
        //                 day: "numeric",
        //                 month: "long",
        //                 year: "numeric",
        //             }),
        //             endTime: endDate.toLocaleTimeString("en-US", {
        //                 hour: "numeric",
        //                 minute: "2-digit",
        //                 hour12: true,
        //             })
        //         };
        //     }
            
        //     const result = {show_form,event,user_token,slug,EventParticipantData,participantUser,base64Image,...formattedDates}
        //     return safeCallback(null, result);
        // }
        
    } catch (error) {
        return safeCallback(error, null);
    }
}

export const getEventParticipantUserListModal = async(slug: string, callback: (error: any, result: any) => void) => {

    try {
        const event = await eventSchema
            .findOne({ event_slug: slug })
            .select("+event_logo +event_image +show_location_image");
    
        if (!event) {
            return callback({ message: "Event not found" }, null); 
        }
    
        const eventParticipants = await EventParticipantSchema.find({
            event_id: event._id,
        });
    
        if (!eventParticipants.length) {
            return callback({ message: "No participants found for this event" }, null); 
        }
    
        const participantUserIds = eventParticipants.map(
            (participant) => participant.participant_user_id
        );
    
        const participants = await ParticipantSchema.find({
            _id: { $in: participantUserIds },
        });
    
        
        return callback(null, { event, participants }); 
    } catch (error) {
        return callback({ message: "An error occurred", error }, null); 
    }
}

export const getAllEventParticipantUserListModal = async (
  loginUserData: any,
  filters: any,
  pagination: any,
  event_id: any,
  callback: (error: any, result: any) => void
) => {
  try {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    console.log('🔍 Debug getAllEventParticipantUserListModal:', {
      loginUserData: loginUserData?.company_id,
      filters,
      pagination,
      event_id
    });

    // If event_id is provided, fetch participants for that specific event
    if (event_id) {
      console.log('🔍 Searching for specific event ID:', event_id);
      
      // Try to find event in both eventHost and regular event schemas
      let event = await eventHostSchema.findById(event_id);
      let eventSource = 'eventHost';
      
      if (!event) {
        event = await eventSchema.findById(event_id);
        eventSource = 'event';
      }
      
      if (!event) {
        return callback({ message: "Event not found" }, null);
      }
      
      console.log('🔍 Found event in schema:', eventSource, event._id);

      // Get participants linked to this event
      const eventParticipants = await EventParticipantSchema.find({
        event_id: event._id,
      });

      console.log('🔍 Found event participants:', eventParticipants.length);
      console.log('🔍 Event participants details:', eventParticipants.map(ep => ({
        id: ep._id,
        participant_user_id: ep.participant_user_id,
        event_id: ep.event_id,
        status: ep.status,
        checkin_time: ep.checkin_time,
        checkout_time: ep.checkout_time
      })));

      if (!eventParticipants.length) {
        return callback(null, { 
          participants: [], 
          totalUsers: 0,
          totalPages: 0,
          page, 
          limit 
        });
      }

      const participantUserIds = eventParticipants.map(
        (ep) => ep.participant_user_id.toString()
      );

      console.log('🔍 Participant user IDs:', participantUserIds);

      // Build filter for participants
      let participantFilter: any = {
        _id: { $in: participantUserIds },
      };

      if (filters) {
        participantFilter["$or"] = [
          { "dynamic_fields.first_name": { $regex: filters, $options: "i" } },
          { "dynamic_fields.last_name": { $regex: filters, $options: "i" } },
          { "dynamic_fields.email": { $regex: filters, $options: "i" } },
          { "dynamic_fields.email_address": { $regex: filters, $options: "i" } },
          { "dynamic_fields.name": { $regex: filters, $options: "i" } },
        ];
      }

      console.log('🔍 Participant filter:', JSON.stringify(participantFilter, null, 2));

      // Get total count for pagination
      const totalUsers = await ParticipantSchema.countDocuments(participantFilter);
      const totalPages = Math.ceil(totalUsers / limit);

      const participants = await ParticipantSchema.find(participantFilter)
        .skip(skip)
        .limit(limit);

      console.log('🔍 Found participants:', participants.length);

        const participantsWithEvent = participants.map((participant) => {
        const matchingEP = eventParticipants.find(
          (ep) => {
            const epUserId = ep.participant_user_id ? ep.participant_user_id.toString() : '';
            const participantId = (participant as { _id: any })._id ? (participant as { _id: any })._id.toString() : '';
            return epUserId === participantId;
          }
        );

        console.log(`🔍 Mapping participant ${participant._id}:`, {
          participant_id: participant._id,
          matchingEP_id: matchingEP?._id,
          matchingEP_participant_user_id: matchingEP?.participant_user_id,
          registration_number: matchingEP?.registration_number,
          checkin_time: matchingEP?.checkin_time,
          checkout_time: matchingEP?.checkout_time,
          status: matchingEP?.status
        });

        return {
          ...participant.toObject(),
          event_title: event.eventName || event.event_title,
          event_id: event._id,
          registration_number: matchingEP?.registration_number || null,
          checkin_time: matchingEP?.checkin_time || null,
          checkout_time: matchingEP?.checkout_time || null,
          status: matchingEP?.status || null,
        };
      });      return callback(null, { 
        participants: participantsWithEvent, 
        totalUsers,
        totalPages,
        page, 
        limit 
      });
    }

    // If no specific event_id, get all events for this company and their participants
    let eventFilter: any = { company_id: loginUserData.company_id };

    // Search in both event schemas
    const hostEvents = await eventHostSchema
      .find(eventFilter)
      .select("eventName company_name _id");
      
    const regularEvents = await eventSchema
      .find(eventFilter)
      .select("event_title company_name _id");

    const allEvents = [
      ...hostEvents.map(e => ({ ...e.toObject(), eventName: e.eventName, source: 'host' })),
      ...regularEvents.map(e => ({ ...e.toObject(), eventName: e.event_title, source: 'regular' }))
    ];

    if (!allEvents.length) {
      return callback({ message: "No events found" }, null);
    }

    let allParticipants: any[] = [];

    for (const event of allEvents) {
      const eventParticipants = await EventParticipantSchema.find({
        event_id: event._id,
      });

      if (eventParticipants.length) {
        const participantUserIds = eventParticipants.map(
          (ep) => ep.participant_user_id.toString()
        );

        let participantFilter: any = {
          _id: { $in: participantUserIds },
        };

        if (filters) {
          participantFilter["$or"] = [
            { "dynamic_fields.first_name": { $regex: filters, $options: "i" } },
            { "dynamic_fields.last_name": { $regex: filters, $options: "i" } },
            { "dynamic_fields.email": { $regex: filters, $options: "i" } },
            { "dynamic_fields.email_address": { $regex: filters, $options: "i" } },
            { "dynamic_fields.name": { $regex: filters, $options: "i" } },
          ];
        }

        const participants = await ParticipantSchema.find(participantFilter);

        const participantsWithEvent = participants.map((participant) => {
          const matchingEP = eventParticipants.find(
            (ep) => {
              const epUserId = ep.participant_user_id ? ep.participant_user_id.toString() : '';
              const participantId = (participant as { _id: any })._id ? (participant as { _id: any })._id.toString() : '';
              return epUserId === participantId;
            }
          );

          return {
            ...participant.toObject(),
            event_title: event.eventName,
            event_id: event._id,
            registration_number: matchingEP?.registration_number || null,
            checkin_time: matchingEP?.checkin_time || null,
            checkout_time: matchingEP?.checkout_time || null,
            status: matchingEP?.status || null,
          };
        });

        allParticipants = allParticipants.concat(participantsWithEvent);
      }
    }

    // Apply pagination to final results
    const totalUsers = allParticipants.length;
    const totalPages = Math.ceil(totalUsers / limit);
    const paginatedParticipants = allParticipants.slice(skip, skip + limit);

    return callback(null, { 
      participants: paginatedParticipants, 
      totalUsers,
      totalPages,
      page, 
      limit 
    });
  } catch (error) {
    console.error('❌ Error in getAllEventParticipantUserListModal:', error);
    return callback({ message: "An error occurred", error }, null);
  }
};


export const getPeopleListOptimized = async (
  loginUserData: any,
  filters: any,
  pagination: any,
  event_id: any,
  callback: (error: any, result: any) => void
) => {
  try {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    console.log('🔍 Debug getPeopleListOptimized:', {
      loginUserData: loginUserData?.company_id,
      filters,
      pagination,
      event_id
    });

    // If event_id is provided, fetch participants for that specific event
    if (event_id) {
      console.log('🔍 Searching for specific event ID:', event_id);
      
      // Try to find event in both eventHost and regular event schemas
      let event = await eventHostSchema.findById(event_id);
      let eventSource = 'eventHost';
      
      if (!event) {
        event = await eventSchema.findById(event_id);
        eventSource = 'event';
      }
      
      if (!event) {
        return callback({ message: "Event not found" }, null);
      }
      
      console.log('🔍 Found event in schema:', eventSource, event._id);

      // Get participants linked to this event
      const eventParticipants = await EventParticipantSchema.find({
        event_id: event._id,
      }).select('participant_user_id registration_number createdAt');

      console.log('🔍 Found event participants:', eventParticipants.length);

      if (!eventParticipants.length) {
        return callback(null, { 
          participants: [], 
          totalUsers: 0,
          totalPages: 0,
          page, 
          limit 
        });
      }

      // Get ticket name from the event's ticketId (only available in eventHost schema)
      let ticketName = "N/A";
      if ((event as any).ticketId) {
        const ticket = await ticketSchema.findById((event as any).ticketId).select('ticketName');
        ticketName = ticket?.ticketName || "N/A";
      }

      const participantUserIds = eventParticipants.map(
        (ep) => ep.participant_user_id.toString()
      );

      console.log('🔍 Participant user IDs:', participantUserIds);

      // Build filter for participants (name, email, phone)
      let participantFilter: any = {
        _id: { $in: participantUserIds },
      };

      // Build filter for event participants (registration number)
      let eventParticipantFilter: any = {
        event_id: event._id,
      };

      let filteredParticipantUserIds = participantUserIds;

      if (filters) {
        // Check if search term matches ticket name
        const ticketNameMatch = ticketName.toLowerCase().includes(filters.toLowerCase());
        
        // Search in participant data
        participantFilter["$or"] = [
          { "dynamic_fields.first_name": { $regex: filters, $options: "i" } },
          { "dynamic_fields.last_name": { $regex: filters, $options: "i" } },
          { "dynamic_fields.email": { $regex: filters, $options: "i" } },
          { "dynamic_fields.email_address": { $regex: filters, $options: "i" } },
          { "dynamic_fields.name": { $regex: filters, $options: "i" } },
          { "dynamic_fields.phone": { $regex: filters, $options: "i" } },
          { "dynamic_fields.mobile": { $regex: filters, $options: "i" } },
          { "dynamic_fields.contact": { $regex: filters, $options: "i" } },
        ];

        // Search in registration numbers
        eventParticipantFilter["$or"] = [
          { registration_number: { $regex: filters, $options: "i" } }
        ];

        // Get participant IDs that match registration number search
        const matchingEPs = await EventParticipantSchema.find(eventParticipantFilter)
          .select('participant_user_id');
        
        const regNumberMatchIds = matchingEPs.map(ep => ep.participant_user_id.toString());

        // Get participant IDs that match participant data search
        const participantMatchIds = await ParticipantSchema.find(participantFilter)
          .select('_id')
          .then(docs => docs.map(doc => (doc as any)._id.toString()));

        // Combine all matching IDs (participant data + registration number + ticket name)
        let allMatchingIds = [...new Set([...participantMatchIds, ...regNumberMatchIds])];
        
        // If ticket name matches, include all participants
        if (ticketNameMatch) {
          allMatchingIds = [...new Set([...allMatchingIds, ...participantUserIds])];
        }

        // Update the final filter to only include matching participants
        filteredParticipantUserIds = allMatchingIds.filter(id => participantUserIds.includes(id));
        
        participantFilter = {
          _id: { $in: filteredParticipantUserIds },
        };
      }

      console.log('🔍 Participant filter:', JSON.stringify(participantFilter, null, 2));

      // Get total count for pagination
      const totalUsers = await ParticipantSchema.countDocuments(participantFilter);
      const totalPages = Math.ceil(totalUsers / limit);

      const participants = await ParticipantSchema.find(participantFilter)
        .select('dynamic_fields createdAt')
        .skip(skip)
        .limit(limit);

      console.log('🔍 Found participants:', participants.length);

      const participantsWithEvent = participants.map((participant) => {
        const matchingEP = eventParticipants.find(
          (ep) => {
            const epUserId = ep.participant_user_id ? ep.participant_user_id.toString() : '';
            const participantId = participant._id ? participant._id.toString() : '';
            return epUserId === participantId;
          }
        );

        const userData = participant?.dynamic_fields || {};
        
        // Extract name
        let name = "N/A";
        if (userData.first_name || userData.last_name) {
          name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
        } else if (userData.name) {
          name = userData.name;
        } else if (userData.full_name) {
          name = userData.full_name;
        } else if (userData.fullName) {
          name = userData.fullName;
        } else if (userData.participant_name) {
          name = userData.participant_name;
        }

        // Extract contact info
        let contactInfo = [];
        if (userData.email) {
          contactInfo.push(userData.email);
        } else if (userData.email_address) {
          contactInfo.push(userData.email_address);
        }

        // Get phone number from various possible fields
        const phoneFields = ['phone', 'mobile', 'phone_number', 'mobile_number', 'contact', 'contact_number'];
        for (const field of phoneFields) {
          if (userData[field]) {
            contactInfo.push(userData[field]);
            break; // Only add one phone number
          }
        }

        return {
          _id: participant._id,
          name,
          contact_info: contactInfo.length > 0 ? contactInfo.join(' | ') : "N/A",
          registration_number: matchingEP?.registration_number || "N/A",
          ticket_name: ticketName,
          registration_date: (matchingEP as any)?.createdAt || (participant as any)?.createdAt,
        };
      });

      return callback(null, { 
        participants: participantsWithEvent, 
        totalUsers,
        totalPages,
        page, 
        limit 
      });
    }

    // If no specific event_id, return empty for People page (People page should always have event_id)
    return callback(null, { 
      participants: [], 
      totalUsers: 0,
      totalPages: 0,
      page, 
      limit 
    });

  } catch (error) {
    console.error('❌ Error in getPeopleListOptimized:', error);
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
  






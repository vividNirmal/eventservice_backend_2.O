import { Request, Response } from "express";
import { loggerMsg } from "../../lib/logger";
import { successCreated, successResponse ,ErrorResponse, errorResponseWithData } from "../../helper/apiResponse";
import { storeEvent,updateEvent,getEventTokenDetails ,adminEventList,getEventParticipantUserListModal,getAllEventParticipantUserListModal,getPeopleListOptimized,updateEventExtraDetails} from "../../domain/models/event.model";
import {v4 as uuidv4} from "uuid"
import multer from "multer"
import path from "path"
import fs from "fs";
import eventSchema from "../../domain/schema/event.schema";
import eventParticipantSchema from "../../domain/schema/eventParticipant";
import deviceUrlMappingSchema from "../../domain/schema/deviceUrlMapping.schema";
import formUrlMappingSchema from "../../domain/schema/formUrlMapping.schema";
import reasonSchema from "../../domain/schema/RFV.schema";
import companyActivitySchema from "../../domain/schema/companyActivity.schema";
import Companyactivity from "../../domain/schema/event.schema";
import { cryptoService } from "../../services/cryptoService";
import { env } from "process";
import participantUsersSchema from "../../domain/schema/participantUsers.schema";
import scannerMachineSchema from "../../domain/schema/scannerMachine.schema";
import jwt from "jsonwebtoken";
import scannerTokenSchema from "../../domain/schema/scannerToken.schema";
import eventHostSchema from "../../domain/schema/eventHost.schema";
import crypto from "crypto";
import ticketSchema from "../../domain/schema/ticket.schema";
import formRegistrationSchema from "../../domain/schema/formRegistration.schema";

interface FileWithBuffer extends Express.Multer.File {
buffer: Buffer;
}
  
const upload = multer();

const key = env.ENCRYPT_KEY;
const iv = env.DECRYPT_KEY; 

export const getAdminEventDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
    
        const user = await eventSchema.findById(id).select('+event_logo +event_image');
        
        if (!user) {
            return ErrorResponse(res, "User not found");
        }
    
        const baseUrl = env.BASE_URL; 
    
        if (user.event_logo) {
            user.event_logo = baseUrl +'/'+ user.event_logo;
        }
    
        if (user.event_image) {
            user.event_image = baseUrl +'/'+ user.event_image;
        }

        if (user.show_location_image) {
            user.show_location_image = baseUrl +'/'+ user.show_location_image;
        }else{
            user.show_location_image = "";
        }

        if (user.event_sponsor) {
            user.event_sponsor = baseUrl +'/'+ user.event_sponsor;
        }else{
            user.event_sponsor = "";
        }

        const company_visit = await reasonSchema.find({ event_id: id });
        const visitReason = await companyActivitySchema.find({ event_id: id });
    
        return successResponse(res, 'Get Admin Event Details', {
            user,
            company_visit,
            visitReason
        });
        
    } catch (error) {
        return ErrorResponse(res, 'An error occurred during event retrieval.');
    }
};

export const deleteAdminEvent = async (req: Request, res: Response) => {
    try {

        const { events_ids } = req.body; 

        if (!events_ids || !Array.isArray(events_ids) || events_ids.length === 0) {
            return ErrorResponse(res, "No event IDs provided");
        }
        
        const events = await eventSchema.find({ _id: { $in: events_ids } });
        
        if (events.length === 0) {
            return ErrorResponse(res, "No matching events found");
        }
        
        await eventSchema.deleteMany({ _id: { $in: events_ids } });
        await reasonSchema.deleteMany({ event_id: { $in: events_ids } });
        await Companyactivity.deleteMany({ event_id: { $in: events_ids } });
        
        return successResponse(res, "Events and related data deleted successfully", {});
    } catch (error) {
        return ErrorResponse(res,'An error occurred during event retrieval.')
    }
};

export const getAdminEventList = async (req: Request, res: Response) => {

    try {
        const { page = 1, pageSize = 10, searchQuery = "" } = req.query;
        adminEventList(req.user,req.body,
            parseInt(page as string),
            parseInt(pageSize as string),
            searchQuery as string, (error:any, result:any) => {
            if (error) {
                return res.status(500).json({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error instanceof Error ? error.message : "An unexpected error occurred."
                });
            }
            return successResponse(res, 'Get Admin Event List', 
                result,
            )
        });
    } catch (error) {
        return  ErrorResponse(res,'An error occurred during user registration.')
    }
      
};

export const getAdminEvents = async (req: Request, res: Response) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).send("No files uploaded.");
          }
      
          const files = req.files as FileWithBuffer[];
          
          files.forEach((file) => {
            const field_name = file.fieldname; 
            const fileName = `${Date.now()}-${file.originalname}`; 
            
            const savePath = path.join("uploads", fileName); 
            
            fs.writeFileSync(savePath, file.buffer); 
          
            req.body[field_name] = savePath; 
          });

        const { company_name, event_title, event_slug, reason_for_visiting,event_description,start_date, end_date,google_map_url,address,event_type,company_activity,organizer_name,organizer_email,organizer_phone,sort_des_about_event} = req.body;
        
        storeEvent(req.user,req.body, (error:any, result:any) => {
            if (error) {
                return res.status(500).json({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error instanceof Error ? error.message : "An unexpected error occurred."
                });
            }
            return successCreated(res, result)
        });
    } catch (error) {
        return ErrorResponse(res,'An error occurred during event retrieval.')
    }
};

export const storeAdminEvent = async (req: Request, res: Response) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).send("No files uploaded.");
        }

        const files = req.files as FileWithBuffer[];

        files.forEach((file) => {
            const field_name = file.fieldname;
            const fileName = `${Date.now()}-${file.originalname}`;

            const savePath = path.join("uploads", fileName);

            fs.writeFileSync(savePath, file.buffer);

            req.body[field_name] = savePath;
        });

        const {
            company_name,
            event_title,
            event_slug,
            reason_for_visiting,
            event_description,
            start_date,
            end_date,
            google_map_url,
            address,
            event_type,
            company_activity,
            organizer_name,
            organizer_email,
            organizer_phone,
            sort_des_about_event,
        } = req.body;

        storeEvent(req.user,req.body, (error: any, result: any) => {
            if (error) {
                return ErrorResponse(res, error.message);
            }

            return successResponse(res, "Get Admin Event List", { result });
        });
    } catch (error) {
        return ErrorResponse(res, "An error occurred during event retrieval.");
    }
};

export const updateAdminEvent = async (req: Request, res: Response) => {
    try {
          const files = req.files as FileWithBuffer[];
          
          files.forEach((file) => {
            const field_name = file.fieldname; 
            const fileName = `${Date.now()}-${file.originalname}`; 
            
            const savePath = path.join("uploads", fileName); 
            
            fs.writeFileSync(savePath, file.buffer); 
          
            req.body[field_name] = savePath; 
          });

        const { company_name, event_title, event_slug, reason_for_visiting,event_description,start_date, end_date,google_map_url,address,event_type,company_activity,organizer_name,organizer_email,organizer_phone,sort_des_about_event} = req.body;
        
        updateEvent(req.body, (error:any, result:any) => {
            if (error) {
                return res.status(500).json({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error instanceof Error ? error.message : "An unexpected error occurred."
                });
            }
            return successCreated(res, result)
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An error occurred during user registration.",
        });
    }
};

export const generateUniqueURL = async (req:Request, res:Response) => {
    try{
      
        const token = uuidv4();
        const key = env.ENCRYPT_KEY
        const iv = env.DECRYPT_KEY
        const { slug } = req.params;

        const combinedValue = `${token}:${slug}`;
        
        const encryptedText = cryptoService.encryptCombinedValue(token, slug,key,iv); 

        return res.status(200).json({
            status: "success",
            encryptedText,    
        });
    
        // const redirectUrl = `https://example.com/redirect?token=${encodeURIComponent(encryptedText.encryptedText)}`;
        // return res.redirect(redirectUrl);

    }catch(error){

        return ErrorResponse(res,'An error occurred during event retrieval.')

    }
}

export const getDeviceUrl = async (req: Request, res: Response) => {
    try {
        const { id: event_id, type: device_type } = req.body; // or req.query depending on how you call it
        console.log("Received event_id:", req.body);

        if (!event_id || device_type === undefined) {
            return res.status(400).json({ 
                code: "BAD_REQUEST", 
                message: "event_id and device_type are required." 
            });
        }

        // 1. Verify the event exists in eventHost schema
        const event = await eventHostSchema.findById(event_id);
        if (!event) {
            console.log("Event not found:", event_id);
            return res.status(404).json({
                code: "NOT_FOUND",
                message: "Event not found"
            });
        }

        const company_id = event.company_id;
        if (!company_id) {
            return res.status(400).json({
                code: "INVALID_EVENT",
                message: "Event has no company assigned."
            });
        }

        console.log("Company ID:", company_id);
        console.log("Device Type:", device_type);

        // 2. Find device for that company and device type
        const device = await scannerMachineSchema.findOne({
            company_id,
            device_type: String(device_type)
        });

        if (!device) {
            return res.status(404).json({
                code: "DEVICE_NOT_FOUND",
                message: "No device found for given company and type."
            });
        }

        // 3. Encode device_key and device_type
        const key = env.ENCRYPT_KEY;
        const iv = env.DECRYPT_KEY;

        const encodedData = cryptoService.encryptCombinedValue(
            device.device_key,
            device.device_type,
            key,
            iv
        );

        // 4. Send response
        return successResponse(res, "Device URL generated", {
            encoded: encodedData.encryptedText
        });

    } catch (error) {
        console.error(error);
        return ErrorResponse(res, "An error occurred while generating device URL.");
    }
};

export const verifyDeviceAndLogin = async (req: Request, res: Response) => {
    try {
        const { key: encodedKey, deviceKey: userEnteredDeviceKey } = req.body;

        if (!encodedKey || !userEnteredDeviceKey) {
            return res.status(400).json({
                code: "BAD_REQUEST",
                message: "key and deviceKey are required."
            });
        }

        const key = env.ENCRYPT_KEY;
        const iv = env.DECRYPT_KEY;

        // 1. Decrypt
        let decoded;
        try {
            decoded = cryptoService.decryptCombinedValue(encodedKey, key, iv);
        } catch (err) {
            return res.status(400).json({
                code: "INVALID_KEY",
                message: "Invalid or corrupted key."
            });
        }

        const { token: decodedDeviceKey, slug: decodedDeviceType } = decoded;

        // 2. Match device key
        if (decodedDeviceKey !== userEnteredDeviceKey) {
            return res.status(401).json({
                code: "UNAUTHORIZED",
                message: "Device key does not match."
            });
        }

        // 3. Find device
        const device = await scannerMachineSchema.findOne({
            device_key: decodedDeviceKey,
            device_type: decodedDeviceType
        });

        if (!device) {
            return res.status(404).json({
                code: "DEVICE_NOT_FOUND",
                message: "No matching device found."
            });
        }

        // 4. Validate status and expiry
        if (device.status === "0") {
            return res.status(403).json({
                code: "DEVICE_DISABLED",
                message: "This device is disabled."
            });
        }

        if (device.expired_date && device.expired_date < new Date()) {
            return res.status(403).json({
                code: "DEVICE_EXPIRED",
                message: "Device validity has expired."
            });
        }

        // 5. Create scanner token
        const jwtToken = jwt.sign(
            { machine_id: device._id, type: device.device_type },
            process.env.JWT_SECRET_KEY || "defaultsecretkey",
            { expiresIn: "24h" }
        );

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await scannerTokenSchema.create({
            machine_id: device._id,
            token: jwtToken,
            expiresAt
        });

        // 6. Respond with token and type
        return successResponse(res, "Scanner login successful", {
            token: jwtToken,
            type: device.device_type,
            scanner_unique_id: device.scanner_unique_id
        });

    } catch (error) {
        console.error(error);
        return ErrorResponse(res, "An error occurred during device verification.");
    }
};

export const getTokeneventDetails = async (req:Request , res:Response) =>{
    try {
        let { token } = req.params;

        if (!token) {
            return ErrorResponse(res,'Token is required.')
        }

        // Remove 'token=' prefix if present
        if (token.startsWith('token=')) {
            token = token.substring(6);
        }

        console.log('🎫 Extracted token:', token);

        getEventTokenDetails(token, (error: any, result: any) => {
            console.log('📞 Callback invoked with:', { error: !!error, result: !!result });
            if (error) {
                console.log('❌ Returning error response');
                return ErrorResponse(res,error)
            }
            console.log('✅ Returning success response');
            return successResponse(res, 'success', {
                result,
            });

        });

    } catch (error) {
      return  ErrorResponse(res,'An internal server error occurred.')
    }
}

export const getParticipantUserList = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        if (!token) {
            return ErrorResponse(res, 'Token is required.'); 
        }

        getEventParticipantUserListModal(token, (error: any, result: any) => {
            if (error) {
                return ErrorResponse(res, error.message || 'Invalid or expired token.'); 
            }

            return successResponse(res, 'Success', {
                result,
            });
        });
    } catch (error) {
        return ErrorResponse(res, 'An internal server error occurred.');
    }
};

export const generateRegistrationURL = async (req: Request, res: Response) => {
    try {
        const token = uuidv4();
        const key = env.ENCRYPT_KEY
        const iv = env.DECRYPT_KEY
        const { slug } = req.params;

        const combinedValue = `${token}:${slug}`;
        
        const encryptedText = cryptoService.encryptCombinedValue(token, slug,key,iv);
        
        const redirectUrl = `https://eventservices.in/event/${encodeURIComponent(encryptedText.encryptedText)}`;
        return res.redirect(redirectUrl);
        
    } catch (error) {
        return ErrorResponse(res, 'An internal server error occurred.');
    }
}

export const getAllParticipantUserList = async (req: Request, res: Response) => {
    try {
        const { searchQuery = "", page = "1", limit = "10",event_id = "", startDate = "", // Add this line
      endDate = "" } = req.query;

        const filters = searchQuery.toString();
        const pagination = {
            page: parseInt(page as string, 10),
            limit: parseInt(limit as string, 10),
        };

        getAllEventParticipantUserListModal(req.user, filters,pagination ,event_id, startDate, endDate, (error: any, result: any) => {
            if (error) {
                return ErrorResponse(res, error.message || "Invalid or expired token.");
            }

            return successResponse(res, "Success", result);
        });
    } catch (error) {
        return ErrorResponse(res, "An internal server error occurred.");
    }
};

export const getPeopleList = async (req: Request, res: Response) => {
    try {
        const { searchQuery = "", page = "1", pageSize = "10", event_id = "" } = req.query;

        const filters = searchQuery.toString();
        const pagination = {
            page: parseInt(page as string, 10),
            limit: parseInt(pageSize as string, 10),
        };

        getPeopleListOptimized(req.user, filters, pagination, event_id, (error: any, result: any) => {
            if (error) {
                return ErrorResponse(res, error.message || "Invalid or expired token.");
            }

            return successResponse(res, "Success", result);
        });
    } catch (error) {
        return ErrorResponse(res, "An internal server error occurred.");
    }
};

export const UpdateExtraEventDetails = async (req: Request, res: Response) => {
    try {
            
        console.log(req.body)
        const { creason_for_visiting,company_activity,sort_des_about_event,event_id} = req.body;
        
        updateEventExtraDetails(req.body, (error:any, result:any) => {
            if (error) {
                return res.status(500).json({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error instanceof Error ? error.message : "An unexpected error occurred."
                });
            }
            return successCreated(res, result)
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "An error occurred during user registration.",
        });
    }
}

export const GetExtraEventDetails = async (req: Request, res: Response) => {
    try {
        console.log(req.body);
        const { id } = req.body;
        console.log(id);

        if (!id) {
            return ErrorResponse(res, "Event ID is required");
        }

        const event = await eventSchema.findById(id).select('+event_logo +event_image');

        if (!event) {
            return ErrorResponse(res, "Event not found");
        }

        const company_visit = await companyActivitySchema.find({ event_id: event._id });
        const visitReason = await reasonSchema.find({ event_id: event._id });

        const event_data = {
            event_title: event.event_title || "",
            sort_des_about_event : event.sort_des_about_event || "",
            event_description: event.event_description || "",
            company_visit : company_visit,
            visitReason : visitReason
        };

        return successResponse(res, "Success", event_data);
    } catch (error) {
        console.error(error); 
        return ErrorResponse(res, 'An internal server error occurred.');
    }
};

export const getParticipantUserDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
    
        const user = await participantUsersSchema.findById(id);
        
        if (!user) {
            return ErrorResponse(res, "User not found");
        }
    
        const baseUrl = env.BASE_URL; 
    
        return successResponse(res, 'Get Admin Event Details', {
            user
        });
        
    } catch (error) {
        return ErrorResponse(res, 'An error occurred during event retrieval.');
    }
};

export const getEventStatistics = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return ErrorResponse(res, "Event ID is required");
        }

        // Find the event
        const event = await eventHostSchema.findById(id);
        if (!event) {
            return ErrorResponse(res, "Event not found");
        }

        // Get all participants for this event
        const participants = await formRegistrationSchema.find({ eventId: id }).populate("eventId").populate("ticketId");
        console.log("Total participants found:", participants.length);
        // Calculate statistics
        const totalRegistered = participants.length;
        const totalCheckedIn = participants.filter(p => p.status === 'in').length;
        const totalCapacity = event.participant_capacity || 1000; // Default capacity if not set
        
        // Get participants with face scan data (if applicable)
        const faceScansCount = participants.filter(p => p.faceId && p.faceId.trim() !== '').length;
        
        // Daily check-ins for chart data (last 7 days)
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const dailyCheckIns = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));
            
            const dayCheckIns = participants.filter(p => 
                p.checkin_time && 
                p.checkin_time >= startOfDay && 
                p.checkin_time <= endOfDay
            ).length;
            
            dailyCheckIns.push({
                date: startOfDay.toISOString().split('T')[0],
                count: dayCheckIns
            });
        }

        const statistics = {
            totalRegistered,
            totalCheckedIn,
            totalCapacity,
            faceScansCount,
            dailyCheckIns,
            event: {
                id: event._id,
                title: event.eventName,
                company_name: event.company_name,
                start_date: event.startDate,
                end_date: event.endDate
            }
        };

        return successResponse(res, 'Event statistics retrieved successfully', statistics);
    } catch (error) {
        console.error('Error getting event statistics:', error);
        return ErrorResponse(res, 'An error occurred while retrieving event statistics.');
    }
};

export const generateCleanDeviceUrl = async (req: Request, res: Response) => {
    try {
        const { id: event_id, type: device_type } = req.body;
        console.log("Received event_id for clean URL:", req.body);

        if (!event_id || device_type === undefined) {
            return res.status(400).json({ 
                code: "BAD_REQUEST", 
                message: "event_id and device_type are required." 
            });
        }

        // 1. Verify the event exists in eventHost schema
        const event = await eventHostSchema.findById(event_id);
        if (!event) {
            console.log("Event not found:", event_id);
            return res.status(404).json({
                code: "NOT_FOUND",
                message: "Event not found"
            });
        }

        const company_id = event.company_id;
        if (!company_id) {
            return res.status(400).json({
                code: "INVALID_EVENT",
                message: "Event has no company assigned."
            });
        }

        console.log("Company ID:", company_id);
        console.log("Device Type:", device_type);

        // 2. Find device for that company and device type
        const device = await scannerMachineSchema.findOne({
            company_id,
            device_type: String(device_type)
        });

        if (!device) {
            return res.status(404).json({
                code: "DEVICE_NOT_FOUND",
                message: "No device found for given company and type."
            });
        }

        // 3. Encode device_key and device_type first
        const key = env.ENCRYPT_KEY;
        const iv = env.DECRYPT_KEY;

        const encodedData = cryptoService.encryptCombinedValue(
            device.device_key,
            device.device_type,
            key,
            iv
        );

        // 4. Check if a mapping already exists for this event and encoded device key
        const existingMapping = await deviceUrlMappingSchema.findOne({
            eventId: event_id,
            deviceKey: encodedData.encryptedText
        });

        if (existingMapping) {
            console.log("Existing mapping found, returning existing shortId:", existingMapping.shortId);
            return successResponse(res, "Clean device URL retrieved (existing)", {
                shortId: existingMapping.shortId
            });
        }

        // 5. Generate a short unique ID (8 characters) with collision detection
        let shortId;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            shortId = crypto.randomBytes(4).toString('hex');
            attempts++;
            
            // Check if this shortId already exists
            const existingShortId = await deviceUrlMappingSchema.findOne({ shortId });
            if (!existingShortId) {
                break; // Found a unique shortId
            }
            
            if (attempts >= maxAttempts) {
                throw new Error("Unable to generate unique shortId after maximum attempts");
            }
        } while (true);

        // 6. Store the mapping in the database
        const deviceUrlMapping = new deviceUrlMappingSchema({
            shortId,
            eventId: event_id,
            eventSlug: event.event_slug,
            deviceKey: encodedData.encryptedText
        });

        await deviceUrlMapping.save();

        console.log("New mapping created with shortId:", shortId);
        
        // 7. Send response with short ID
        return successResponse(res, "Clean device URL generated", {
            shortId: shortId
        });

    } catch (error) {
        console.error(error);
        return ErrorResponse(res, "An error occurred while generating clean device URL.");
    }
};

export const resolveDeviceUrl = async (req: Request, res: Response) => {
    try {
        const { shortId } = req.params;

        if (!shortId) {
            return res.status(400).json({
                code: "BAD_REQUEST",
                message: "shortId is required."
            });
        }

        // Find the mapping in the database
        const mapping = await deviceUrlMappingSchema.findOne({ shortId });

        if (!mapping) {
            return res.status(404).json({
                code: "NOT_FOUND",
                message: "Invalid or expired device URL."
            });
        }

        // Return the parameters for redirection
        return successResponse(res, "Device URL resolved", {
            key: mapping.deviceKey,
            event_slug: mapping.eventSlug
        });

    } catch (error) {
        console.error(error);
        return ErrorResponse(res, "An error occurred while resolving device URL.");
    }
};

export const generateCleanFormUrl = async (req: Request, res: Response) => {
    try {
        const { event_id, form_id } = req.body;

        if (!event_id || !form_id) {
            return res.status(400).json({
                code: "BAD_REQUEST",
                message: "event_id and form_id are required."
            });
        }

        // 1. Verify event exists
        const event = await eventHostSchema.findById(event_id);
        if (!event) {
            return res.status(404).json({
                code: "EVENT_NOT_FOUND",
                message: "Event not found."
            });
        }

        // 2. Check if event has a slug
        if (!event.event_slug) {
            return res.status(400).json({
                code: "MISSING_SLUG",
                message: "Event slug is required to generate form URL."
            });
        }

        // 3. Generate encrypted event data (similar to the current form URL generation)
        const token = uuidv4();
        const key = env.ENCRYPT_KEY;
        const iv = env.DECRYPT_KEY;

        const encryptedData = cryptoService.encryptCombinedValue(
            token,
            event.event_slug || '',
            key,
            iv
        );

        // 4. Check if a mapping already exists for this event and form combination
        const existingMapping = await formUrlMappingSchema.findOne({
            eventId: event_id,
            formId: form_id
        });

        if (existingMapping) {
            console.log("Existing form URL mapping found, returning event slug:", event.event_slug);
            return successResponse(res, "Clean form URL retrieved (existing)", {
                eventSlug: event.event_slug,
                formId: form_id
            });
        }

        // 5. Check if shortId (event slug) already exists in the collection
        const duplicateShortId = await formUrlMappingSchema.findOne({
            shortId: event.event_slug
        });

        if (duplicateShortId) {
            console.log("ShortId already exists:", event.event_slug, "for event:", duplicateShortId.eventId);
            
            // If it's for a different event but same slug, we need to modify the shortId
            // But for now, let's just return the event slug since URLs should be based on event slug
            return successResponse(res, "Clean form URL retrieved (duplicate shortId)", {
                eventSlug: event.event_slug,
                formId: form_id
            });
        }

        // 6. Store/update the mapping in the database using event slug as identifier
        const formUrlMapping = new formUrlMappingSchema({
            shortId: event.event_slug, // Use event slug as identifier
            eventId: event_id,
            eventSlug: event.event_slug,
            formId: form_id,
            encryptedEventData: encryptedData.encryptedText
        });

        await formUrlMapping.save();

        console.log("New form URL mapping created with slug:", event.event_slug);
        
        // 7. Send response with event slug
        return successResponse(res, "Clean form URL generated", {
            eventSlug: event.event_slug,
            formId: form_id
        });

    } catch (error) {
        console.error(error);
        return ErrorResponse(res, "An error occurred while generating clean form URL.");
    }
};          

export const resolveFormUrl = async (req: Request, res: Response) => {
    try {
        const { eventSlug } = req.params;

        if (!eventSlug) {
            return res.status(400).json({
                code: "BAD_REQUEST",
                message: "eventSlug is required."
            });
        }

        // Find the mapping in the database using eventSlug
        const mapping = await formUrlMappingSchema.findOne({ eventSlug });

        if (!mapping) {
            return res.status(404).json({
                code: "NOT_FOUND",
                message: "Invalid or expired form URL."
            });
        }

        // by event slug get the event host details and select ticketId
        const event = await eventHostSchema.findOne({ event_slug: eventSlug });
        if (!event) {
            return res.status(404).json({
                code: "EVENT_NOT_FOUND",
                message: "Event not found for the given slug."
            });
        }
        console.log('🎟️ Event found:', event);
        // If event has ticketId, then get the ticket details from ticketSchema and select registrationFilterDate
        let ticket = null;
        if (event.ticketId) {
            ticket = await ticketSchema.findById(event.ticketId).select("registrationFilterDate");
        }
        // If ticket has registrationFilterDate, then check if current date is within the range
        if (ticket && ticket.advancedSettings.registrationFilterDate) {
            const now = new Date();
            console.log('🎫 Checking registration filter date:', {
                now: now.toISOString(),
                registrationFilterDate: ticket.advancedSettings.registrationFilterDate.toISOString(),
                isInFuture: ticket.advancedSettings.registrationFilterDate > now
            });

            // if the date is in the past and event end date is also over then registration is closed
            // check if event has dateRanges and if current date is within any of the ranges end date
            if (event.dateRanges && event.dateRanges.length > 0) {
                console.log('📅 Checking date ranges:', {
                    now: now.toISOString(),
                    dateRanges: event.dateRanges
                });
                
                const isWithinRange = event.dateRanges.some((range: any) => {
                    const rangeEndDate = new Date(range.endDate);
                    console.log('📊 Range check:', {
                        rangeEndDate: rangeEndDate.toISOString(),
                        isWithin: now <= rangeEndDate
                    });
                    return now <= rangeEndDate;
                });
                
                if (!isWithinRange) {
                    console.log('🔒 Registration closed - all date ranges expired');
                    return errorResponseWithData(res, "Registration closed. Event date is over.", {
                        eventEndDate: event.endDate,
                        dateRanges: event.dateRanges
                    });
                }
            } else {
                // if no dateRanges then check with event end date
                console.log('📅 Checking single end date:', {
                    now: now.toISOString(),
                    eventEndDate: event.endDate,
                    isExpired: event.endDate && now > new Date(event.endDate)
                });
                
                if (event.endDate && now > new Date(event.endDate)) {
                    console.log('🔒 Registration closed - event end date passed');
                    return errorResponseWithData(res, "Registration closed. Event date is over.", {
                        eventEndDate: event.endDate
                    });
                }
            }
            
            // if the date is in the future
            if (ticket.advancedSettings.registrationFilterDate > now) {
                console.log('⏰ Registration not started yet');
                return errorResponseWithData(res, "Registration not started yet.", {
                    registrationFilterDate: ticket.advancedSettings.registrationFilterDate
                });
            }
        }

        // Return the parameters for redirection
        console.log('✅ Registration is open - URL resolved successfully');
        return successResponse(res, "Form URL resolved", {
            encryptedEventData: mapping.encryptedEventData,
            formId: mapping.formId,
            eventSlug: mapping.eventSlug
        });

    } catch (error) {
        console.error(error);
        return ErrorResponse(res, "An error occurred while resolving form URL.");
    }
};
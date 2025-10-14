import { Request, Response } from "express";
import {
  successCreated,
  successResponse,
  ErrorResponse,
} from "../../helper/apiResponse";
import {
  adminEventHostList,
  storeEventHost,
  updateEventHost, 
  getAdminEventHostListByCompany as getAdminEventHostListByCompanyModel
} from "../../domain/models/eventHost.model";
import multer from "multer";
import eventHostSchema from "../../domain/schema/eventHost.schema";
import ticketSchema from "../../domain/schema/ticket.schema";
import { env } from "process";

interface FileWithBuffer extends Express.Multer.File {
  buffer: Buffer;
}

const upload = multer();

const key = env.ENCRYPT_KEY;
const iv = env.DECRYPT_KEY;

export const getAdminEventHostList = async (req: Request, res: Response) => {

  try {
    const { page = 1, pageSize = 10, searchQuery = "" } = req.query;
    adminEventHostList(req.user,
      parseInt(page as string),
      parseInt(pageSize as string),
      searchQuery as string, (error: any, result: any) => {
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
    return ErrorResponse(res, 'An error occurred during user registration.')
  }

};

export const getAdminEventHostListByCompany = async (req: Request, res: Response) => {

  try {
    const { page = 1, pageSize = 10, searchQuery = "", companyId } = req.query;

    getAdminEventHostListByCompanyModel(req.user, companyId as string,
      parseInt(page as string),
      parseInt(pageSize as string),
      searchQuery as string, (error: any, result: any) => {
        if (error) {
          return res.status(500).json({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "An unexpected error occurred."
          });
        }
        return successResponse(res, 'Get Admin Event Host List By Company',
          result,
        )
      });

  } catch (error) {
    return ErrorResponse(res, 'An error occurred during user registration.')
  }
};

export const getAdminEventHostDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const eventHost = await eventHostSchema.findById(id).select('+event_logo +event_image');

    if (!eventHost) {
      return ErrorResponse(res, "Event not found");
    }

    const baseUrl = env.BASE_URL;

    if (eventHost.event_logo) {
      eventHost.event_logo = baseUrl + '/' + eventHost.event_logo;
    }

    if (eventHost.event_image) {
      eventHost.event_image = baseUrl + '/' + eventHost.event_image;
    }

    if (eventHost.show_location_image) {
      eventHost.show_location_image = baseUrl + '/' + eventHost.show_location_image;
    } else {
      eventHost.show_location_image = "";
    }

    if (eventHost.event_sponsor) {
      eventHost.event_sponsor = baseUrl + '/' + eventHost.event_sponsor;
    } else {
      eventHost.event_sponsor = "";
    }

    return successResponse(res, 'Get Admin Event Host Details', {
      user: eventHost
    });

  } catch (error) {
    return ErrorResponse(res, 'An error occurred during event retrieval.');
  }
};

export const storeAdminEventHost = async (req: Request, res: Response) => {
  try {
    console.log("=== DEBUG: storeAdminEventHost controller called ===");
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);
    console.log("Request user:", req.user);

    // Process uploaded files and add them to the request body
    if (req.files && typeof req.files === 'object' && !Array.isArray(req.files)) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (files.event_image && files.event_image[0]) {
        req.body.event_image = files.event_image[0].filename;
        console.log("Event image processed:", req.body.event_image);
      }
      
      if (files.event_logo && files.event_logo[0]) {
        req.body.event_logo = files.event_logo[0].filename;
        console.log("Event logo processed:", req.body.event_logo);
      }
      
      if (files.show_location_image && files.show_location_image[0]) {
        req.body.show_location_image = files.show_location_image[0].filename;
        console.log("Show location image processed:", req.body.show_location_image);
      }
      
      if (files.event_sponsor && files.event_sponsor[0]) {
        req.body.event_sponsor = files.event_sponsor[0].filename;
        console.log("Event sponsor processed:", req.body.event_sponsor);
      }
    }

    // Process dateRanges if sent as JSON string
    if (req.body.dateRanges && typeof req.body.dateRanges === 'string') {
      try {
        req.body.dateRanges = JSON.parse(req.body.dateRanges);
        console.log("Parsed dateRanges:", req.body.dateRanges);
      } catch (error) {
        console.log("Error parsing dateRanges JSON:", error);
        req.body.dateRanges = [];
      }
    }

    console.log("Request body after file processing:", req.body);

    storeEventHost(req.user, req.body, (error: any, result: any) => {
      if (error) {
        console.log("=== DEBUG: Error in controller callback ===");
        console.log("Error:", error);
        return ErrorResponse(res, error.message);
      }

      console.log("=== DEBUG: Success in controller callback ===");
      console.log("Result:", result);
      return successResponse(res, "Event host succesfully", { result });
    });
  } catch (error) {
    console.log("=== DEBUG: Catch block in controller ===");
    console.log("Error:", error);
    return ErrorResponse(res, "An error occurred during event retrieval.");
  }
};

export const updateAdminEventHost = async (req: Request, res: Response) => {
  try { 
    // Create a data object to hold all the update data
    const updateData: any = { ...req.body };    
    

    // Process uploaded files - .any() returns an ARRAY
    if (req.files && Array.isArray(req.files)) {
      const files = req.files as Express.Multer.File[];            
      files.forEach((file) => {        
        
        const folder = (file as any).uploadFolder || 'images';
        const filePath = `${folder}/${file.filename}`;
        
        // Map file to correct field based on fieldname
        if (file.fieldname === 'event_image') {
          updateData.event_image = filePath;
        } else if (file.fieldname === 'event_logo') {
          updateData.event_logo = filePath;
        } else if (file.fieldname === 'show_location_image') {
          updateData.show_location_image = filePath;
        } else if (file.fieldname === 'event_sponsor') {
          updateData.event_sponsor = filePath;
        }
      });
    } else {
      console.log('No files uploaded or wrong format'); // DEBUG
    }

    // Process dateRanges if sent as JSON string
    if (updateData.dateRanges && typeof updateData.dateRanges === 'string') {
      try {
        updateData.dateRanges = JSON.parse(updateData.dateRanges);        
      } catch (error) {        
        updateData.dateRanges = [];
      }
    }        
    
    updateEventHost(updateData, (error: any, result: any) => {
      if (error) {
        return res.status(500).json({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred.",
        });
      }
      return successCreated(res, result);
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error instanceof Error ? error.message : "An unexpected error occurred.",
    });
  }
};

// Link ticket to event host
export const linkTicketToEventHost = async (req: Request, res: Response) => {
  try {
    const { eventHostId, ticketId } = req.body;

    if (!eventHostId || !ticketId) {
      return ErrorResponse(res, "Event Host ID and Ticket ID are required");
    }

    // Check if event host exists
    const eventHost = await eventHostSchema.findById(eventHostId);
    if (!eventHost) {
      return ErrorResponse(res, "Event Host not found");
    }

    // Check if ticket exists
    const ticket = await ticketSchema.findById(ticketId);
    if (!ticket) {
      return ErrorResponse(res, "Ticket not found");
    }

    // Link the ticket and form to the event host
    eventHost.ticketId = ticketId;
    eventHost.selected_form_id = ticket.registrationFormId ? ticket.registrationFormId.toString() : undefined;

    await eventHost.save();

    return successResponse(res, "Ticket successfully linked to Event Host", {
      eventHostId: eventHost._id,
      ticketId: ticketId,
      eventName: eventHost.eventName,
      ticketName: ticket.ticketName
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error instanceof Error ? error.message : "An unexpected error occurred.",
    });
  }
};

// Check if ticket is linked to event host
export const checkTicketLinkStatus = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;

    if (!ticketId) {
      return ErrorResponse(res, "Ticket ID is required");
    }

    // Check if this ticket is linked to any event host
    const linkedEventHost = await eventHostSchema.findOne({ ticketId }).select('_id eventName');
    
    return successResponse(res, "Ticket link status retrieved", {
      ticketId,
      isLinked: !!linkedEventHost,
      linkedEventHost: linkedEventHost ? {
        id: linkedEventHost._id,
        eventName: linkedEventHost.eventName
      } : null
    });

  } catch (error) {
    return res.status(500).json({
      status: "error", 
      message: error instanceof Error ? error.message : "An unexpected error occurred.",
    });
  }
};

// Copy event host
export const copyAdminEventHost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Find the original event host
    const originalEventHost = await eventHostSchema.findById(id);

    if (!originalEventHost) {
      return ErrorResponse(res, "Original event host not found");
    }

    // Create a copy of the event host data
    const eventHostObject = originalEventHost.toObject();
    
    // Create a new object with only the required fields matching EventHostData interface
    const eventHostData = {
      eventName: `Copy of ${eventHostObject.eventName}`,
      eventShortName: `Copy of ${eventHostObject.eventShortName}`,
      eventTimeZone: eventHostObject.eventTimeZone,
      startDate: eventHostObject.startDate,
      startTime: eventHostObject.startTime,
      endDate: eventHostObject.endDate,
      endTime: eventHostObject.endTime,
      eventType: eventHostObject.eventType || eventHostObject.event_type || "conference", // Handle both field names
      eventCategory: eventHostObject.eventCategory || [],
      location: eventHostObject.location || "",
      // Copy optional fields if they exist
      company_id: eventHostObject.company_id,
      company_name: eventHostObject.company_name,
      event_title: eventHostObject.event_title,
      event_slug: "", // Clear slug for new event to avoid conflicts
      event_description: eventHostObject.event_description,
      start_date: eventHostObject.start_date,
      end_date: eventHostObject.end_date,
      google_map_url: eventHostObject.google_map_url,
      address: eventHostObject.address,
      event_type: eventHostObject.event_type,
      event_logo: eventHostObject.event_logo,
      event_image: eventHostObject.event_image,
      show_location_image: eventHostObject.show_location_image,
      event_sponsor: eventHostObject.event_sponsor,
      organizer_name: eventHostObject.organizer_name,
      organizer_email: eventHostObject.organizer_email,
      organizer_phone: eventHostObject.organizer_phone,
      with_face_scanner: eventHostObject.with_face_scanner,
      // Don't copy selected_form_id and ticketId to avoid association conflicts
    };
    
    // Use the storeEventHost model function to save the new event host
    storeEventHost(req.user, eventHostData, (error: any, result: any) => {
      if (error) {
        console.log("Error copying event host:", error);
        return ErrorResponse(res, error.message);
      }

      return successResponse(res, "Event host copied successfully", { 
        originalId: id,
        copiedEvent: result 
      });
    });

  } catch (error) {
    console.log("Error in copyAdminEventHost:", error);
    return ErrorResponse(res, "An error occurred while copying the event host.");
  }
};

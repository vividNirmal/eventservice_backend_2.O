import { logger } from "../../lib/logger";
import TicketSchema, { ITicket } from "../schema/ticket.schema";
import FormSchema from "../schema/form.schema";
import mongoose from "mongoose";
import { env } from "../../../infrastructure/env";
import userTypeMapSchema from "../schema/userTypeMap.schema";
import { createSlug } from "../../lib/slugify";


const parseJsonFields = (data: any) => {
  if (data.advancedSettings && typeof data.advancedSettings === 'string') {
    try {
      data.advancedSettings = JSON.parse(data.advancedSettings);
    } catch (err) {
      throw new Error('Invalid JSON for advancedSettings');
    }
  }

  if (data.notifications && typeof data.notifications === 'string') {
    try {
      data.notifications = JSON.parse(data.notifications);
    } catch (err) {
      throw new Error('Invalid JSON for notifications');
    }
  }

//   if (data.slotAmounts && typeof data.slotAmounts === 'string') {
//     try {
//       data.slotAmounts = JSON.parse(data.slotAmounts);
//     } catch (err) {
//       throw new Error('Invalid JSON for slotAmounts');
//     }
//   }

  return data;
};

interface TicketFilterOptions {
    userType?: string;
    ticketCategory?: string;
    status?: 'active' | 'inactive' | 'expired';
    search?: string;
}

interface PaginationOptions {
    page: number;
    limit: number;
}

/**
 * Helper function to add base URL to image fields
 */
const addImageUrls = (ticket: any) => {
    const baseUrl = env.BASE_URL;
    if (ticket) {
        if (ticket.bannerImage) {
            ticket.bannerImageUrl = `${baseUrl}/uploads/${ticket.bannerImage}`;
        }
        if (ticket.desktopBannerImage) {
            ticket.desktopBannerImageUrl = `${baseUrl}/uploads/${ticket.desktopBannerImage}`;
        }
        if (ticket.mobileBannerImage) {
            ticket.mobileBannerImageUrl = `${baseUrl}/uploads/${ticket.mobileBannerImage}`;
        }
    }
    return ticket;
};

/**
 * Get all tickets with pagination and filtering
 */
export const getAllTickets = async (
    companyId: mongoose.Types.ObjectId,
    filters: TicketFilterOptions = {},
    pagination: PaginationOptions = { page: 1, limit: 10 },
    eventId?: mongoose.Types.ObjectId,
) => {
    try {
        const { userType, ticketCategory, status, search } = filters;
        const { page, limit } = pagination;

        // Build search query
        const searchQuery: any = {};
        if (companyId != null || companyId !== undefined) {
            searchQuery.companyId = companyId;
        }
        if (userType) {
            searchQuery.userType = userType;
        }

        if (ticketCategory) {
            searchQuery.ticketCategory = ticketCategory;
        }

        if (status) {
            searchQuery.status = status;
        }
        if (eventId) {
            searchQuery.eventId = eventId;
        }

        if (search) {
            searchQuery.$or = [
                { ticketName: { $regex: search, $options: 'i' } },
                { userType: { $regex: search, $options: 'i' } },
                { ticketCategory: { $regex: search, $options: 'i' } },
                { status: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { serialNoPrefix: { $regex: search, $options: 'i' } },
                { amount: { $regex: search, $options: 'i' } }
            ];
        }

        // Get total count
        const totalCount = await TicketSchema.countDocuments(searchQuery);

        // Get tickets with pagination
        const tickets = await TicketSchema.find(searchQuery)
            .populate('registrationFormId', 'formName userType')
            .populate('userType', 'typeName')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // Add image URLs to tickets
        const ticketsWithUrls = tickets.map(ticket => addImageUrls(ticket.toObject()));

        const totalPages = Math.ceil(totalCount / limit);

        return {
            success: true,
            data: {
                tickets: ticketsWithUrls,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit
                }
            }
        };
    } catch (error: any) {
        logger.error('Error fetching tickets:', error);
        return {
            success: false,
            message: 'Failed to fetch tickets',
            error: error.message
        };
    }
};

/**
 * Get ticket by ID
 */
export const getTicketById = async (
    ticketId: mongoose.Types.ObjectId,
    companyId: mongoose.Types.ObjectId
) => {
    try {
        const ticket = await TicketSchema.findOne({
            _id: ticketId,
            companyId
        }).populate('registrationFormId', 'formName userType');

        if (!ticket) {
            return {
                success: false,
                message: 'Ticket not found'
            };
        }

        // Add image URLs to ticket
        const ticketWithUrls = addImageUrls(ticket.toObject());

        return {
            success: true,
            data: ticketWithUrls
        };
    } catch (error: any) {
        logger.error('Error fetching ticket by ID:', error);
        return {
            success: false,
            message: 'Failed to fetch ticket',
            error: error.message
        };
    }
};

/**
 * Create new ticket
 */
export const createTicket = async (
    ticketData: Partial<ITicket>,
    companyId: mongoose.Types.ObjectId,
    eventId: mongoose.Types.ObjectId
) => {
    try {
        const parsedData = parseJsonFields(ticketData);
        // ---- Add uniqueness check ----
        const existingTicket = await TicketSchema.findOne({
            eventId,
            userType: parsedData.userType
        });
        if (existingTicket) {
            return {
                success: false,
                message: 'A ticket for this user type already exists for this event.'
            };
        }
        const newTicket = new TicketSchema({
            ...parsedData,
            companyId,
            eventId
        });

        const savedTicket = await newTicket.save();
        
        // Populate the registration form details
        await savedTicket.populate('registrationFormId', 'formName userType');

        // Add image URLs to saved ticket
        const ticketWithUrls = addImageUrls(savedTicket.toObject());

        logger.info(`Ticket created successfully: ${savedTicket._id}`);
        
        return {
            success: true,
            data: ticketWithUrls,
            message: 'Ticket created successfully'
        };
    } catch (error: any) {
        logger.error('Error creating ticket:', error);
        console.log("error in ticket", error)
        return {
            success: false,
            message: 'Failed to create ticket',
            error: error.message
        };
    }
};

/**
 * Update ticket
 */
export const updateTicket = async (
    ticketId: mongoose.Types.ObjectId,
    updateData: Partial<ITicket>,
    companyId: mongoose.Types.ObjectId
) => {
    try {
        const parsedData = parseJsonFields(updateData);
        if (parsedData.userType || parsedData.eventId) {
            const existingTicket = await TicketSchema.findOne({
                _id: { $ne: ticketId }, // exclude the ticket being updated
                eventId: parsedData.eventId,
                userType: parsedData.userType
            });

            if (existingTicket) {
                return {
                    success: false,
                    message: 'A ticket for this user type already exists for this event.'
                };
            }
        }

        const updatedTicket = await TicketSchema.findOneAndUpdate(
            { _id: ticketId },
            parsedData,
            { new: true, runValidators: true }
        ).populate('registrationFormId', 'formName userType');

        if (!updatedTicket) {
            return {
                success: false,
                message: 'Ticket not found'
            };
        }

        // Add image URLs to updated ticket
        const ticketWithUrls = addImageUrls(updatedTicket.toObject());

        logger.info(`Ticket updated successfully: ${ticketId}`);
        
        return {
            success: true,
            data: ticketWithUrls,
            message: 'Ticket updated successfully'
        };
    } catch (error: any) {
        logger.error('Error updating ticket:', error);
        return {
            success: false,
            message: 'Failed to update ticket',
            error: error.message
        };
    }
};

/**
 * Delete ticket
 */
export const deleteTicket = async (
    ticketId: mongoose.Types.ObjectId,
    companyId: mongoose.Types.ObjectId
) => {
    try {
        const deletedTicket = await TicketSchema.findOneAndDelete({
            _id: ticketId
        });

        if (!deletedTicket) {
            return {
                success: false,
                message: 'Ticket not found'
            };
        }

        logger.info(`Ticket deleted successfully: ${ticketId}`);
        
        return {
            success: true,
            message: 'Ticket deleted successfully'
        };
    } catch (error: any) {
        logger.error('Error deleting ticket:', error);
        return {
            success: false,
            message: 'Failed to delete ticket',
            error: error.message
        };
    }
};

/**
 * Get tickets by user type (for dropdown population)
 */
export const getTicketsByUserType = async (
    userType: string,
    companyId: mongoose.Types.ObjectId
) => {
    try {
        const tickets = await TicketSchema.find({
            userType,
            status: 'active'
        }).select('ticketName ticketCategory');

        return {
            success: true,
            data: tickets
        };
    } catch (error: any) {
        logger.error('Error fetching tickets by user type:', error);
        return {
            success: false,
            message: 'Failed to fetch tickets by user type',
            error: error.message
        };
    }
};

/**
 * Export tickets and their associated forms for an event
 */
export const exportTicketsForEvent = async (
    eventId: mongoose.Types.ObjectId,
    companyId: mongoose.Types.ObjectId
) => {
    try {
        // Get all tickets for the event
        const tickets = await TicketSchema.find({
            eventId,
        }).populate('registrationFormId');

        if (tickets.length === 0) {
            return {
                success: false,
                message: 'No tickets found for this event'
            };
        }

        // Extract the companyId from tickets (assuming all tickets belong to the same company)
        const extractedCompanyId = tickets[0].companyId;

        // Extract unique form IDs
        const formIds = [...new Set(tickets
            .filter(ticket => ticket.registrationFormId)
            .map(ticket => ticket.registrationFormId?._id.toString())
            .filter(id => id))];
        console.log("formIds", formIds);

        // Get all forms associated with these tickets
        const forms = await FormSchema.find({
            _id: { $in: formIds }
        });
        console.log("forms", forms);

        // Clean up the data for export (remove internal fields)
        const cleanTickets = tickets.map(ticket => {
            const ticketObj = ticket.toObject() as any;
            
            // Store original form ID for mapping during import
            if (ticketObj.registrationFormId && typeof ticketObj.registrationFormId === 'object') {
                ticketObj.originalFormId = ticketObj.registrationFormId._id;
                ticketObj.registrationFormId = undefined; // Will be updated during import
            }
            
            // Remove internal fields
            const { _id, __v, companyId: cId, eventId: eId, createdAt, updatedAt, ...cleanTicket } = ticketObj;
            return cleanTicket;
        });

        const cleanForms = forms.map(form => {
            const formObj = form.toObject() as any;
            // Remove internal fields
            const { _id, __v, companyId: cId, eventId: eId, createdAt, updatedAt, ...cleanForm } = formObj;
            return { ...cleanForm, originalId: _id, companyId: extractedCompanyId};
        });
        console.log("cleanForms", cleanForms);

        return {
            success: true,
            data: {
                tickets: cleanTickets,
                forms: cleanForms
            }
        };
    } catch (error: any) {
        logger.error('Error exporting tickets:', error);
        console.log("error in export", error);
        return {
            success: false,
            message: 'Failed to export tickets',
            error: error.message
        };
    }
};

/**
 * Import tickets and forms to an event
 */
export const importTicketsToEvent = async (
    eventId: mongoose.Types.ObjectId,
    companyId: mongoose.Types.ObjectId,
    importData: any
) => {
    try {
        const { tickets, forms } = importData;
        const formIdMapping = new Map(); // Map original form IDs to new form IDs
        let importedForms = 0;
        let importedTickets = 0;

        // First, create all forms
        for (const formData of forms) {
            const { originalId, ...cleanFormData } = formData;
            
            const newForm = new FormSchema({
                ...cleanFormData,
                companyId,
                eventId
            });
            
            const savedForm = await newForm.save();
            
            // Store the mapping for later use
            if (originalId) {
                formIdMapping.set(originalId.toString(), savedForm._id);
            }
            importedForms++;
        }

        // Then, create all tickets with updated form references
        for (const ticketData of tickets) {
            const { originalFormId, ...cleanTicketData } = ticketData;
            let registrationFormId = null;
            
            // Map the original form ID to the new form ID
            if (originalFormId) {
                registrationFormId = formIdMapping.get(originalFormId.toString());
            }
            
            const newTicket = new TicketSchema({
                ...cleanTicketData,
                companyId,
                eventId,
                registrationFormId
            });
            
            await newTicket.save();
            importedTickets++;
        }
        
        return {
            success: true,
            message: `Successfully imported ${importedTickets} tickets and ${importedForms} forms`,
            data: {
                importedTickets,
                importedForms
            }
        };
    } catch (error: any) {
        logger.error('Error importing tickets:', error);
        return {
            success: false,
            message: 'Failed to import tickets',
            error: error.message
        };
    }
};

export const generateTicketRegistrationUrlModel = async (id: mongoose.Types.ObjectId) => {
    try{
        // Fetch ticket with related info
        const ticket = await TicketSchema.findById(id)
          .populate("eventId")
          .populate("userType");
      
        if (!ticket) {
            return {
                success: false,
                message: 'Ticket not found'
            };
        }
      
        const event: any = ticket.eventId;
        const userType: any = ticket.userType;
      
        if (!event?.event_slug) {
          throw new Error("Event slug not found");
        }
      
        // Check mapping for this user type
        const userTypeMap = await userTypeMapSchema.findOne({
          userType: userType._id,
          companyId: ticket.companyId,
          eventId: ticket.eventId,
        });
      
        // Use mapped short name if available, otherwise original user type name
        const userTypeName = userTypeMap ? userTypeMap.shortName : userType.typeName;
      
        // Create slug
        const userTypeSlug = createSlug(userTypeName);
      
        // Final URL
        const registrationUrl = `/${event.event_slug}/registration-${userTypeSlug}`;
      
        return {
            success: true,
            data: registrationUrl
        };
    } catch (error: any) {
        logger.error('Error in generateRegistrationUrlModel:', error);
        return {
            success: false,
            message: 'Failed to generate registration URL',
            error: error.message
        };
    }
};

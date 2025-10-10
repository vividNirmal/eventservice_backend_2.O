import { Request, Response } from 'express';
import { 
    getAllTickets, getTicketById, createTicket, updateTicket, 
    deleteTicket, getTicketsByUserType, exportTicketsForEvent, importTicketsToEvent,
    generateTicketRegistrationUrlModel
} from '../../domain/models/ticket.model';
import mongoose from 'mongoose';
import { logger } from '../../lib/logger';

/**
 * Get all tickets with pagination and filtering
 */
export const getTicketListController = async (req: Request, res: Response) => {
    try {
        const companyId = req.body.companyId;
        const { page = 1, limit = 10, userType, ticketCategory, 
            status, search, eventId } = req.query;

        const filters = {
            ...(userType && { userType: userType as string }),
            ...(ticketCategory && { ticketCategory: ticketCategory as string }),
            ...(status && { status: status as 'active' | 'inactive' | 'expired' }),
            ...(search && { search: search as string }),
        };

        const pagination = {
            page: parseInt(page as string),
            limit: parseInt(limit as string)
        };

        const result = await getAllTickets(
            companyId, 
            filters, 
            pagination, 
            eventId ? new mongoose.Types.ObjectId(eventId as string) : undefined
        );

        if (result.success) {
            return res.status(200).json({
                status: 1,
                message: 'Tickets fetched successfully',
                data: result.data
            });
        } else {
            return res.status(400).json({
                status: 0,
                message: result.message || 'Failed to fetch tickets'
            });
        }
    } catch (error: any) {
        logger.error('Error in getTicketListController:', error);
        return res.status(500).json({
            status: 0,
            message: 'Internal server error'
        });
    }
};

/**
 * Get ticket by ID
 */
export const getTicketDetailsController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.body.companyId;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 0,
                message: 'Invalid ticket ID'
            });
        }

        const result = await getTicketById(new mongoose.Types.ObjectId(id), companyId);

        if (result.success) {
            return res.status(200).json({
                status: 1,
                message: 'Ticket details fetched successfully',
                data: result.data
            });
        } else {
            return res.status(404).json({
                status: 0,
                message: result.message || 'Ticket not found'
            });
        }
    } catch (error: any) {
        logger.error('Error in getTicketDetailsController:', error);
        return res.status(500).json({
            status: 0,
            message: 'Internal server error'
        });
    }
};

/**
 * Create new ticket
 */
export const createTicketController = async (req: Request, res: Response) => {
    try {
        const companyId = req.body.companyId;
        const eventId = req.body.eventId;
        const ticketData = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        // Handle ticketAmount parsing when coming from FormData
        if (typeof ticketData.ticketAmount === 'string') {
            try {
                ticketData.ticketAmount = JSON.parse(ticketData.ticketAmount);
            } catch (e) {
                // If parsing fails, set to default for free tickets
                ticketData.ticketAmount = {};
            }
        }

        // Parse advancedSettings if coming as a JSON string
        if (typeof ticketData.advancedSettings === "string") {
            try {
                ticketData.advancedSettings = JSON.parse(ticketData.advancedSettings);
            } catch (err) {
                ticketData.advancedSettings = {};
            }
        }

        // Parse notification settings if coming as JSON strings
        if (typeof ticketData.emailNotification === "string") {
            try {
                ticketData.emailNotification = JSON.parse(ticketData.emailNotification);
            } catch (err) {
                ticketData.emailNotification = { enabled: false, templates: [] };
            }
        }

        // Handle file uploads
        if (files && Array.isArray(files)) {
            files.forEach((file) => {
                if (file.fieldname === 'bannerImage') {
                    ticketData.bannerImage = `${file.uploadFolder}/${file.filename}`;
                }
                if (file.fieldname === 'desktopBannerImage') {
                    ticketData.desktopBannerImage = `${file.uploadFolder}/${file.filename}`;
                }
                if (file.fieldname === 'mobileBannerImage') {
                    ticketData.mobileBannerImage = `${file.uploadFolder}/${file.filename}`;
                }
            });
        }

        const result = await createTicket(ticketData, companyId, eventId);

        if (result.success) {
            return res.status(201).json({
                status: 1,
                message: result.message,
                data: result.data
            });
        } else {
            return res.status(400).json({
                status: 0,
                message: result.message || 'Failed to create ticket'
            });
        }
    } catch (error: any) {
        logger.error('Error in createTicketController:', error);
        return res.status(500).json({
            status: 0,
            message: 'Internal server error'
        });
    }
};

/**
 * Update ticket
 */
export const updateTicketController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.body.companyId;
        const updateData = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 0,
                message: 'Invalid ticket ID'
            });
        }
        
        // Remove system fields that shouldn't be updated
        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        delete updateData.__v;

        // Handle ticketAmount parsing when coming from FormData
        if (typeof updateData.ticketAmount === 'string') {
            try {
                updateData.ticketAmount = JSON.parse(updateData.ticketAmount);
            } catch (e) {
                // If parsing fails, set to default for free tickets
                updateData.ticketAmount = {};
            }
        }

        if (typeof updateData.advancedSettings === "string") {
            try {
                updateData.advancedSettings = JSON.parse(updateData.advancedSettings);
            } catch (err) {
                updateData.advancedSettings = {};
            }
        }

        // Parse notification settings if coming as JSON strings
        if (typeof updateData.emailNotification === "string") {
            try {
                updateData.emailNotification = JSON.parse(updateData.emailNotification);
            } catch (err) {
                updateData.emailNotification = { enabled: false, templates: [] };
            }
        }

        // // Handle file uploads
        // if (files) {
        //     if (files.bannerImage && files.bannerImage[0]) {
        //         // updateData.bannerImage = files.bannerImage[0].filename;
        //         const file = files.bannerImage[0];
        //         updateData.bannerImage = `${(file as any).uploadFolder}/${file.filename}`;
        //     }
        //     if (files.desktopBannerImage && files.desktopBannerImage[0]) {
        //         // updateData.desktopBannerImage = files.desktopBannerImage[0].filename;
        //         const file = files.desktopBannerImage[0];
        //         updateData.desktopBannerImage = `${(file as any).uploadFolder}/${file.filename}`;
        //     }
        //     if (files.mobileBannerImage && files.mobileBannerImage[0]) {
        //         // updateData.mobileBannerImage = files.mobileBannerImage[0].filename;
        //         const file = files.mobileBannerImage[0];
        //         updateData.mobileBannerImage = `${(file as any).uploadFolder}/${file.filename}`;
        //     }
        // }

        if (files && Array.isArray(files)) {
            files.forEach((file) => {
                if (file.fieldname === 'bannerImage') {
                    updateData.bannerImage = `${file.uploadFolder}/${file.filename}`;
                }
                if (file.fieldname === 'desktopBannerImage') {
                    updateData.desktopBannerImage = `${file.uploadFolder}/${file.filename}`;
                }
                if (file.fieldname === 'mobileBannerImage') {
                    updateData.mobileBannerImage = `${file.uploadFolder}/${file.filename}`;
                }
            });
        }

        const result = await updateTicket(
            new mongoose.Types.ObjectId(id), 
            updateData, 
            companyId
        );

        if (result.success) {
            return res.status(200).json({
                status: 1,
                message: result.message,
                data: result.data
            });
        } else {
            return res.status(404).json({
                status: 0,
                message: result.message || 'Ticket not found'
            });
        }
    } catch (error: any) {
        logger.error('Error in updateTicketController:', error);
        return res.status(500).json({
            status: 0,
            message: 'Internal server error'
        });
    }
};

/**
 * Delete ticket
 */
export const deleteTicketController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.body.companyId;
        console.log('Delete Ticket - Company ID:', companyId, 'Ticket ID:', id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 0,
                message: 'Invalid ticket ID'
            });
        }

        const result = await deleteTicket(new mongoose.Types.ObjectId(id), companyId);

        if (result.success) {
            return res.status(200).json({
                status: 1,
                message: result.message
            });
        } else {
            return res.status(404).json({
                status: 0,
                message: result.message || 'Ticket not found'
            });
        }
    } catch (error: any) {
        logger.error('Error in deleteTicketController:', error);
        return res.status(500).json({
            status: 0,
            message: 'Internal server error'
        });
    }
};

/**
 * Delete multiple tickets (bulk delete)
 */
export const bulkDeleteTicketsController = async (req: Request, res: Response) => {
    try {
        const { ticketIds } = req.body;
        const companyId = req.body.companyId;
        
        console.log('Bulk Delete Tickets - Company ID:', companyId, 'Ticket IDs:', ticketIds);

        // Validate input
        if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
            return res.status(400).json({
                status: 0,
                message: 'Invalid ticket IDs array'
            });
        }

        // Validate all ticket IDs
        const invalidIds = ticketIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                status: 0,
                message: `Invalid ticket IDs: ${invalidIds.join(', ')}`
            });
        }

        // Convert to ObjectIds
        const objectIds = ticketIds.map(id => new mongoose.Types.ObjectId(id));
        
        // Delete multiple tickets
        const results = await Promise.allSettled(
            objectIds.map(ticketId => deleteTicket(ticketId, companyId))
        );

        // Process results
        const successful = results.filter((result): result is PromiseFulfilledResult<any> => 
            result.status === 'fulfilled' && result.value.success
        ).length;
        
        const failed = results.length - successful;

        if (successful === 0) {
            return res.status(400).json({
                status: 0,
                message: 'Failed to delete any tickets'
            });
        }

        return res.status(200).json({
            status: 1,
            message: `Successfully deleted ${successful} ticket(s)${failed > 0 ? `, failed to delete ${failed} ticket(s)` : ''}`,
            data: {
                successful,
                failed,
                total: ticketIds.length
            }
        });
    } catch (error: any) {
        logger.error('Error in bulkDeleteTicketsController:', error);
        return res.status(500).json({
            status: 0,
            message: 'Internal server error'
        });
    }
};

/**
 * Get tickets by user type (for dropdown population)
 */
export const getTicketsByUserTypeController = async (req: Request, res: Response) => {
    try {
        const { userType } = req.params;
        const companyId = req.body.companyId;

        const validUserTypes = [
            'Event Attendee', 
            'Exhibiting Company', 
            'Sponsor', 
            'Speaker', 
            'Service Provider', 
            'Accompanying'
        ];

        if (!validUserTypes.includes(userType)) {
            return res.status(400).json({
                status: 0,
                message: 'Invalid user type'
            });
        }

        const result = await getTicketsByUserType(userType, companyId);

        if (result.success) {
            return res.status(200).json({
                status: 1,
                message: 'Tickets fetched successfully',
                data: result.data
            });
        } else {
            return res.status(400).json({
                status: 0,
                message: result.message || 'Failed to fetch tickets'
            });
        }
    } catch (error: any) {
        logger.error('Error in getTicketsByUserTypeController:', error);
        return res.status(500).json({
            status: 0,
            message: 'Internal server error'
        });
    }
};

/**
 * Export tickets for an event
 */
export const exportTicketsController = async (req: Request, res: Response) => {
    try {
        const companyId = req.body.companyId;
        const { eventId } = req.query;

        if (!eventId) {
            return res.status(400).json({
                status: 0,
                message: 'Event ID is required'
            });
        }

        const result = await exportTicketsForEvent(
            new mongoose.Types.ObjectId(eventId as string),
            companyId
        );

        if (result.success) {
            return res.status(200).json({
                status: 1,
                message: 'Tickets exported successfully',
                data: result.data
            });
        } else {
            return res.status(400).json({
                status: 0,
                message: result.message || 'Failed to export tickets'
            });
        }
    } catch (error: any) {
        logger.error('Error in exportTicketsController:', error);
        return res.status(500).json({
            status: 0,
            message: 'Internal server error'
        });
    }
};

/**
 * Import tickets to an event
 */
export const importTicketsController = async (req: Request, res: Response) => {
    try {
        const companyId = req.body.companyId;
        const { eventId, data } = req.body;

        if (!eventId || !data) {
            return res.status(400).json({
                status: 0,
                message: 'Event ID and import data are required'
            });
        }

        // Validate import data structure
        if (!data.tickets || !data.forms || !data.metadata) {
            return res.status(400).json({
                status: 0,
                message: 'Invalid import data format'
            });
        }

        const result = await importTicketsToEvent(
            new mongoose.Types.ObjectId(eventId),
            companyId,
            data
        );

        if (result.success) {
            return res.status(200).json({
                status: 1,
                message: 'Tickets imported successfully',
                data: result.data
            });
        } else {
            return res.status(400).json({
                status: 0,
                message: result.message || 'Failed to import tickets'
            });
        }
    } catch (error: any) {
        logger.error('Error in importTicketsController:', error);
        return res.status(500).json({
            status: 0,
            message: 'Internal server error'
        });
    }
};

export const generateTicketRegistrationUrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            status: 0,
            message: 'Invalid ticket ID'
        });
    }

    const result = await generateTicketRegistrationUrlModel(new mongoose.Types.ObjectId(id));
        if (result.success) {
            return res.status(200).json({
                status: 1,
                message: 'Ticket URL generated successfully',
                data: result.data
            });
        } else {
            return res.status(404).json({
                status: 0,
                message: result.message || 'Ticket URL not generated'
            });
        }
  } catch (error: any) {
        logger.error('Error in generateRegistrationUrlModel:', error);
        return res.status(500).json({
            status: 0,
            message: 'Internal server error'
        });
  }
};

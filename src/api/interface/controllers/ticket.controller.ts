import { Request, Response } from 'express';
import { 
    getAllTickets, getTicketById, createTicket, updateTicket, 
    deleteTicket, getTicketsByUserType, exportTicketsForEvent, importTicketsToEvent
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

        // Handle slotAmounts parsing when coming from FormData
        if (typeof ticketData.slotAmounts === 'string') {
            try {
                ticketData.slotAmounts = JSON.parse(ticketData.slotAmounts);
            } catch (e) {
                // If parsing fails, set to empty array for free tickets
                ticketData.slotAmounts = ticketData.isFree ? [] : [];
            }
        }

        // Convert string numbers to numbers when coming from FormData
        // if (typeof ticketData.startCount === 'string') {
        //     ticketData.startCount = parseInt(ticketData.startCount) || 0;
        // }
        // if (typeof ticketData.ticketPerUser === 'string') {
        //     ticketData.ticketPerUser = parseInt(ticketData.ticketPerUser) || 1;
        // }
        // if (typeof ticketData.ticketBuyLimitMin === 'string') {
        //     ticketData.ticketBuyLimitMin = parseInt(ticketData.ticketBuyLimitMin) || 1;
        // }
        // if (typeof ticketData.ticketBuyLimitMax === 'string') {
        //     ticketData.ticketBuyLimitMax = parseInt(ticketData.ticketBuyLimitMax) || 10;
        // }
        // if (typeof ticketData.isFree === 'string') {
        //     ticketData.isFree = ticketData.isFree === 'true';
        // }
        // if (typeof ticketData.hasQuantityLimit === 'string') {
        //     ticketData.hasQuantityLimit = ticketData.hasQuantityLimit === 'true';
        // }
        // if (typeof ticketData.allowCrossRegister === 'string') {
        //     ticketData.allowCrossRegister = ticketData.allowCrossRegister === 'true';
        // }
        // if (typeof ticketData.autoApprovedUser === 'string') {
        //     ticketData.autoApprovedUser = ticketData.autoApprovedUser === 'true';
        // }
        // if (typeof ticketData.authenticateByOTP === 'string') {
        //     ticketData.authenticateByOTP = ticketData.authenticateByOTP === 'true';
        // }
        // if (typeof ticketData.autoPassword === 'string') {
        //     ticketData.autoPassword = ticketData.autoPassword === 'true';
        // }
        // if (typeof ticketData.addAllDiscount === 'string') {
        //     ticketData.addAllDiscount = ticketData.addAllDiscount === 'true';
        // }
        // if (typeof ticketData.individualDiscount === 'string') {
        //     ticketData.individualDiscount = ticketData.individualDiscount === 'true';
        // }
        // if (typeof ticketData.emailNotification === 'string') {
        //     ticketData.emailNotification = ticketData.emailNotification === 'true';
        // }
        // if (typeof ticketData.smsNotification === 'string') {
        //     ticketData.smsNotification = ticketData.smsNotification === 'true';
        // }
        // if (typeof ticketData.whatsappNotification === 'string') {
        //     ticketData.whatsappNotification = ticketData.whatsappNotification === 'true';
        // }

        // Parse advancedSettings if coming as a JSON string
        if (typeof ticketData.advancedSettings === "string") {
            try {
                ticketData.advancedSettings = JSON.parse(ticketData.advancedSettings);
            } catch (err) {
                ticketData.advancedSettings = {};
            }
        }

        // Handle file uploads
        if (files) {
            if (files.bannerImage && files.bannerImage[0]) {
                ticketData.bannerImage = files.bannerImage[0].filename;
            }
            if (files.desktopBannerImage && files.desktopBannerImage[0]) {
                ticketData.desktopBannerImage = files.desktopBannerImage[0].filename;
            }
            if (files.mobileBannerImage && files.mobileBannerImage[0]) {
                ticketData.mobileBannerImage = files.mobileBannerImage[0].filename;
            }
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

        // Handle slotAmounts parsing when coming from FormData
        if (typeof updateData.slotAmounts === 'string') {
            try {
                updateData.slotAmounts = JSON.parse(updateData.slotAmounts);
            } catch (e) {
                // If parsing fails, set to empty array for free tickets
                updateData.slotAmounts = updateData.isFree ? [] : [];
            }
        }

        // Convert string numbers to numbers when coming from FormData
        // if (typeof updateData.startCount === 'string') {
        //     updateData.startCount = parseInt(updateData.startCount) || 0;
        // }
        // if (typeof updateData.ticketPerUser === 'string') {
        //     updateData.ticketPerUser = parseInt(updateData.ticketPerUser) || 1;
        // }
        // if (typeof updateData.ticketBuyLimitMin === 'string') {
        //     updateData.ticketBuyLimitMin = parseInt(updateData.ticketBuyLimitMin) || 1;
        // }
        // if (typeof updateData.ticketBuyLimitMax === 'string') {
        //     updateData.ticketBuyLimitMax = parseInt(updateData.ticketBuyLimitMax) || 10;
        // }
        // if (typeof updateData.isFree === 'string') {
        //     updateData.isFree = updateData.isFree === 'true';
        // }
        // if (typeof updateData.hasQuantityLimit === 'string') {
        //     updateData.hasQuantityLimit = updateData.hasQuantityLimit === 'true';
        // }
        // if (typeof updateData.allowCrossRegister === 'string') {
        //     updateData.allowCrossRegister = updateData.allowCrossRegister === 'true';
        // }
        // if (typeof updateData.autoApprovedUser === 'string') {
        //     updateData.autoApprovedUser = updateData.autoApprovedUser === 'true';
        // }
        // if (typeof updateData.authenticateByOTP === 'string') {
        //     updateData.authenticateByOTP = updateData.authenticateByOTP === 'true';
        // }
        // if (typeof updateData.autoPassword === 'string') {
        //     updateData.autoPassword = updateData.autoPassword === 'true';
        // }
        // if (typeof updateData.addAllDiscount === 'string') {
        //     updateData.addAllDiscount = updateData.addAllDiscount === 'true';
        // }
        // if (typeof updateData.individualDiscount === 'string') {
        //     updateData.individualDiscount = updateData.individualDiscount === 'true';
        // }
        // if (typeof updateData.emailNotification === 'string') {
        //     updateData.emailNotification = updateData.emailNotification === 'true';
        // }
        // if (typeof updateData.smsNotification === 'string') {
        //     updateData.smsNotification = updateData.smsNotification === 'true';
        // }
        // if (typeof updateData.whatsappNotification === 'string') {
        //     updateData.whatsappNotification = updateData.whatsappNotification === 'true';
        // }

        if (typeof updateData.advancedSettings === "string") {
            try {
                updateData.advancedSettings = JSON.parse(updateData.advancedSettings);
            } catch (err) {
                updateData.advancedSettings = {};
            }
        }

        // Handle file uploads
        if (files) {
            if (files.bannerImage && files.bannerImage[0]) {
                updateData.bannerImage = files.bannerImage[0].filename;
            }
            if (files.desktopBannerImage && files.desktopBannerImage[0]) {
                updateData.desktopBannerImage = files.desktopBannerImage[0].filename;
            }
            if (files.mobileBannerImage && files.mobileBannerImage[0]) {
                updateData.mobileBannerImage = files.mobileBannerImage[0].filename;
            }
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

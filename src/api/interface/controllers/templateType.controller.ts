import { Request, Response } from 'express';
import { 
  getAllTemplateTypes, 
  getTemplateTypeById, 
  createTemplateType, 
  updateTemplateType, 
  deleteTemplateType 
} from '../../domain/models/templateType.model';
import mongoose from 'mongoose';
import { logger } from '../../lib/logger';

/**
 * Get all template types with pagination and filtering
 */
export const getTemplateTypeListController = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, type, search } = req.query;

    const filters = {
      ...(type && { type: type as "email" | "sms" | "whatsapp" }),
      ...(search && { search: search as string }),
    };

    const pagination = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const result = await getAllTemplateTypes(
      filters, 
      pagination
    );

    if (result.success) {
      return res.status(200).json({
        status: 1,
        message: 'Template types fetched successfully',
        data: result.data
      });
    } else {
      return res.status(400).json({
        status: 0,
        message: result.message || 'Failed to fetch template types'
      });
    }
  } catch (error: any) {
    logger.error('Error in getTemplateTypeListController:', error);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error'
    });
  }
};

/**
 * Get template type by ID
 */
export const getTemplateTypeDetailsController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid template type ID'
      });
    }

    const result = await getTemplateTypeById(new mongoose.Types.ObjectId(id));

    if (result.success) {
      return res.status(200).json({
        status: 1,
        message: 'Template type details fetched successfully',
        data: result.data
      });
    } else {
      return res.status(404).json({
        status: 0,
        message: result.message || 'Template type not found'
      });
    }
  } catch (error: any) {
    logger.error('Error in getTemplateTypeDetailsController:', error);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error'
    });
  }
};

/**
 * Create new template type
 */
export const createTemplateTypeController = async (req: Request, res: Response) => {
  try {
    const templateTypeData = req.body;

    const result = await createTemplateType(templateTypeData);

    if (result.success) {
      return res.status(201).json({
        status: 1,
        message: result.message,
        data: result.data
      });
    } else {
      return res.status(400).json({
        status: 0,
        message: result.message || 'Failed to create template type'
      });
    }
  } catch (error: any) {
    logger.error('Error in createTemplateTypeController:', error);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error'
    });
  }
};

/**
 * Update template type
 */
export const updateTemplateTypeController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid template type ID'
      });
    }
    
    // Remove system fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;

    const result = await updateTemplateType(
      new mongoose.Types.ObjectId(id), 
      updateData
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
        message: result.message || 'Template type not found'
      });
    }
  } catch (error: any) {
    logger.error('Error in updateTemplateTypeController:', error);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete template type
 */
export const deleteTemplateTypeController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid template type ID'
      });
    }

    const result = await deleteTemplateType(new mongoose.Types.ObjectId(id));

    if (result.success) {
      return res.status(200).json({
        status: 1,
        message: result.message
      });
    } else {
      return res.status(404).json({
        status: 0,
        message: result.message || 'Template type not found'
      });
    }
  } catch (error: any) {
    logger.error('Error in deleteTemplateTypeController:', error);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error'
    });
  }
};
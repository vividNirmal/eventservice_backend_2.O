import { Request, Response } from 'express';
import { 
  getAllTemplates, 
  getTemplateById, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate 
} from '../../domain/models/template.model';
import mongoose from 'mongoose';
import { logger } from '../../lib/logger';

/**
 * Get all templates with pagination and filtering
 */
export const getTemplateListController = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, type, status, search, typeId } = req.query;

    const filters = {
      ...(type && { type: type as "email" | "sms" | "whatsapp" }),
      ...(status && { status: status as "active" | "inactive" }),
      ...(search && { search: search as string }),
      ...(typeId && { typeId: new mongoose.Types.ObjectId(typeId as string)})
    };

    const pagination = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const result = await getAllTemplates(
      filters, 
      pagination
    );

    if (result.success) {
      return res.status(200).json({
        status: 1,
        message: 'Templates fetched successfully',
        data: result.data
      });
    } else {
      return res.status(400).json({
        status: 0,
        message: result.message || 'Failed to fetch templates'
      });
    }
  } catch (error: any) {
    logger.error('Error in getTemplateListController:', error);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error'
    });
  }
};

/**
 * Get template by ID
 */
export const getTemplateDetailsController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid template ID'
      });
    }

    const result = await getTemplateById(new mongoose.Types.ObjectId(id));

    if (result.success) {
      return res.status(200).json({
        status: 1,
        message: 'Template details fetched successfully',
        data: result.data
      });
    } else {
      return res.status(404).json({
        status: 0,
        message: result.message || 'Template not found'
      });
    }
  } catch (error: any) {
    logger.error('Error in getTemplateDetailsController:', error);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error'
    });
  }
};

/**
 * Create new template
 */
export const createTemplateController = async (req: Request, res: Response) => {
  try {
    const templateData = req.body;

    const result = await createTemplate(templateData);

    if (result.success) {
      return res.status(201).json({
        status: 1,
        message: result.message,
        data: result.data
      });
    } else {
      return res.status(400).json({
        status: 0,
        message: result.message || 'Failed to create template'
      });
    }
  } catch (error: any) {
    logger.error('Error in createTemplateController:', error);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error'
    });
  }
};

/**
 * Update template
 */
export const updateTemplateController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid template ID'
      });
    }
    
    // Remove system fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;

    const result = await updateTemplate(
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
        message: result.message || 'Template not found'
      });
    }
  } catch (error: any) {
    logger.error('Error in updateTemplateController:', error);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete template
 */
export const deleteTemplateController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid template ID'
      });
    }

    const result = await deleteTemplate(new mongoose.Types.ObjectId(id));

    if (result.success) {
      return res.status(200).json({
        status: 1,
        message: result.message
      });
    } else {
      return res.status(404).json({
        status: 0,
        message: result.message || 'Template not found'
      });
    }
  } catch (error: any) {
    logger.error('Error in deleteTemplateController:', error);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error'
    });
  }
};
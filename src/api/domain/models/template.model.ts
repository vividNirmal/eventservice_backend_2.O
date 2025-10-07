import { logger } from "../../lib/logger";
import TemplateSchema, { ITemplate } from "../schema/template.schema";
import mongoose from "mongoose";

interface TemplateFilterOptions {
  type?: "email" | "sms" | "whatsapp";
  status?: "active" | "inactive";
  search?: string;
}

interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * Get all templates with pagination and filtering
 */
export const getAllTemplates = async (
  filters: TemplateFilterOptions = {},
  pagination: PaginationOptions = { page: 1, limit: 10 }
) => {
  try {
    const { type, status, search, typeId } = filters as any;
    const { page, limit } = pagination;

    // Build search query
    const searchQuery: any = {};

    // Filter by type
    if (type) {
      searchQuery.type = type;
    }

    // Filter by status
    if (status) {
      searchQuery.status = status;
    }

    // ✅ Filter by typeId
    if (typeId && mongoose.Types.ObjectId.isValid(typeId)) {
      searchQuery.typeId = new mongoose.Types.ObjectId(typeId);
    }

    // Search across multiple fields
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { text: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const totalData = await TemplateSchema.countDocuments(searchQuery);

    // Get templates with pagination and populate typeId
    const templates = await TemplateSchema.find(searchQuery)
      .populate('typeId', 'typeName type module actionType')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalPages = Math.ceil(totalData / limit);

    return {
      success: true,
      data: {
        templates,
        pagination: {
          currentPage: page,
          totalPages,
          totalData,
          limit
        }
      }
    };
  } catch (error: any) {
    logger.error('Error fetching templates:', error);
    return {
      success: false,
      message: 'Failed to fetch templates',
      error: error.message
    };
  }
};

/**
 * Get template by ID
 */
export const getTemplateById = async (
  templateId: mongoose.Types.ObjectId
) => {
  try {
    const template = await TemplateSchema.findOne({
      _id: templateId
    }).populate('typeId', 'typeName type');

    if (!template) {
      return {
        success: false,
        message: 'Template not found'
      };
    }

    return {
      success: true,
      data: template
    };
  } catch (error: any) {
    logger.error('Error fetching template by ID:', error);
    return {
      success: false,
      message: 'Failed to fetch template',
      error: error.message
    };
  }
};

/**
 * Create new template
 */
export const createTemplate = async (
  templateData: Partial<ITemplate>,
) => {
  try {
    // Check if template with same name and type already exists
    const existingTemplate = await TemplateSchema.findOne({
      name: templateData.name,
      type: templateData.type
    });

    if (existingTemplate) {
      return {
        success: false,
        message: 'Template with this name and type already exists'
      };
    }

    // Validate that typeId exists and matches the template type
    const TemplateTypeSchema = (await import("../schema/templateType.schema")).default;
    const templateType = await TemplateTypeSchema.findOne({
      _id: templateData.typeId
    });

    if (!templateType) {
      return {
        success: false,
        message: 'Template type not found'
      };
    }

    // Ensure template type matches the template's type
    if (templateType.type !== templateData.type) {
      return {
        success: false,
        message: 'Template type does not match the selected template category'
      };
    }

    const newTemplate = new TemplateSchema({
      ...templateData
    });

    const savedTemplate = await newTemplate.save();
    
    // Populate the typeId details
    await savedTemplate.populate('typeId', 'typeName type');

    logger.info(`Template created successfully: ${savedTemplate._id}`);
    
    return {
      success: true,
      data: savedTemplate,
      message: 'Template created successfully'
    };
  } catch (error: any) {
    logger.error('Error creating template:', error);
    
    // Handle validation errors from schema pre-validate
    if (error.message.includes('must have content') || error.message.includes('must have text')) {
      return {
        success: false,
        message: error.message
      };
    }
    
    return {
      success: false,
      message: 'Failed to create template',
      error: error.message
    };
  }
};

/**
 * Update template
 */
export const updateTemplate = async (
  templateId: mongoose.Types.ObjectId,
  updateData: Partial<ITemplate>
) => {
  try {
    // Remove system fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    // delete updateData.__v;

    // Check if template with same name and type already exists (excluding current one)
    if (updateData.name && updateData.type) {
      const existingTemplate = await TemplateSchema.findOne({
        name: updateData.name,
        type: updateData.type,
        _id: { $ne: templateId }
      });

      if (existingTemplate) {
        return {
          success: false,
          message: 'Template with this name and type already exists'
        };
      }
    }

    // Validate typeId if provided
    if (updateData.typeId) {
      const TemplateTypeSchema = (await import("../schema/templateType.schema")).default;
      const templateType = await TemplateTypeSchema.findOne({
        _id: updateData.typeId
      });

      if (!templateType) {
        return {
          success: false,
          message: 'Template type not found'
        };
      }

      // Ensure template type matches the template's type
      if (templateType.type !== updateData.type) {
        return {
          success: false,
          message: 'Template type does not match the template category'
        };
      }
    }

    const updatedTemplate = await TemplateSchema.findOneAndUpdate(
      { _id: templateId },
      updateData,
      { new: true, runValidators: true }
    ).populate('typeId', 'typeName type');

    if (!updatedTemplate) {
      return {
        success: false,
        message: 'Template not found'
      };
    }

    logger.info(`Template updated successfully: ${templateId}`);
    
    return {
      success: true,
      data: updatedTemplate,
      message: 'Template updated successfully'
    };
  } catch (error: any) {
    logger.error('Error updating template:', error);
    
    // Handle validation errors from schema pre-validate
    if (error.message.includes('must have content') || error.message.includes('must have text')) {
      return {
        success: false,
        message: error.message
      };
    }
    
    return {
      success: false,
      message: 'Failed to update template',
      error: error.message
    };
  }
};

/**
 * Delete template
 */
export const deleteTemplate = async (
  templateId: mongoose.Types.ObjectId,
) => {
  try {
    const deletedTemplate = await TemplateSchema.findOneAndDelete({
      _id: templateId
    });

    if (!deletedTemplate) {
      return {
        success: false,
        message: 'Template not found'
      };
    }

    logger.info(`Template deleted successfully: ${templateId}`);
    
    return {
      success: true,
      message: 'Template deleted successfully'
    };
  } catch (error: any) {
    logger.error('Error deleting template:', error);
    return {
      success: false,
      message: 'Failed to delete template',
      error: error.message
    };
  }
};
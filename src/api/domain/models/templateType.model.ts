import { logger } from "../../lib/logger";
import TemplateTypeSchema, { ITemplateType } from "../schema/templateType.schema";
import mongoose from "mongoose";

interface TemplateTypeFilterOptions {
  type?: "email" | "sms" | "whatsapp";
  search?: string;
}

interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * Get all template types with pagination and filtering
 */
export const getAllTemplateTypes = async (
  filters: TemplateTypeFilterOptions = {},
  pagination: PaginationOptions = { page: 1, limit: 10 }
) => {
  try {
    const { type, search } = filters;
    const { page, limit } = pagination;

    // Build search query
    const searchQuery: any = {};

    // Filter by type
    if (type) {
      searchQuery.type = type;
    }

    // Search across multiple fields
    if (search) {
      searchQuery.$or = [
        { typeName: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const totalCount = await TemplateTypeSchema.countDocuments(searchQuery);

    // Get template types with pagination
    const templateTypes = await TemplateTypeSchema.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      data: {
        templateTypes,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit
        }
      }
    };
  } catch (error: any) {
    logger.error('Error fetching template types:', error);
    return {
      success: false,
      message: 'Failed to fetch template types',
      error: error.message
    };
  }
};

/**
 * Get template type by ID
 */
export const getTemplateTypeById = async (
  templateTypeId: mongoose.Types.ObjectId
) => {
  try {
    const templateType = await TemplateTypeSchema.findOne({
      _id: templateTypeId
    });

    if (!templateType) {
      return {
        success: false,
        message: 'Template type not found'
      };
    }

    return {
      success: true,
      data: templateType
    };
  } catch (error: any) {
    logger.error('Error fetching template type by ID:', error);
    return {
      success: false,
      message: 'Failed to fetch template type',
      error: error.message
    };
  }
};

/**
 * Create new template type
 */
export const createTemplateType = async (
  templateTypeData: Partial<ITemplateType>,
) => {
  try {
    // Check if template type with same name and type already exists
    const existingTemplateType = await TemplateTypeSchema.findOne({
      typeName: templateTypeData.typeName,
      type: templateTypeData.type
    });

    if (existingTemplateType) {
      return {
        success: false,
        message: 'Template type with this name and type already exists'
      };
    }

    const newTemplateType = new TemplateTypeSchema({
      ...templateTypeData
    });

    const savedTemplateType = await newTemplateType.save();

    logger.info(`Template type created successfully: ${savedTemplateType._id}`);
    
    return {
      success: true,
      data: savedTemplateType,
      message: 'Template type created successfully'
    };
  } catch (error: any) {
    logger.error('Error creating template type:', error);
    return {
      success: false,
      message: 'Failed to create template type',
      error: error.message
    };
  }
};

/**
 * Update template type
 */
export const updateTemplateType = async (
  templateTypeId: mongoose.Types.ObjectId,
  updateData: Partial<ITemplateType>
) => {
  try {
    // Remove system fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    // delete updateData.__v;

    // Check if template type with same name and type already exists (excluding current one)
    if (updateData.typeName && updateData.type) {
      const existingTemplateType = await TemplateTypeSchema.findOne({
        typeName: updateData.typeName,
        type: updateData.type,
        _id: { $ne: templateTypeId }
      });

      if (existingTemplateType) {
        return {
          success: false,
          message: 'Template type with this name and type already exists'
        };
      }
    }

    const updatedTemplateType = await TemplateTypeSchema.findOneAndUpdate(
      { _id: templateTypeId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTemplateType) {
      return {
        success: false,
        message: 'Template type not found'
      };
    }

    logger.info(`Template type updated successfully: ${templateTypeId}`);
    
    return {
      success: true,
      data: updatedTemplateType,
      message: 'Template type updated successfully'
    };
  } catch (error: any) {
    logger.error('Error updating template type:', error);
    return {
      success: false,
      message: 'Failed to update template type',
      error: error.message
    };
  }
};

/**
 * Delete template type
 */
export const deleteTemplateType = async (
  templateTypeId: mongoose.Types.ObjectId
) => {
  try {
    // Check if any templates are using this template type
    const TemplateSchema = (await import("../schema/template.schema")).default;
    const templatesUsingType = await TemplateSchema.countDocuments({
      typeId: templateTypeId
    });

    if (templatesUsingType > 0) {
      return {
        success: false,
        message: `Cannot delete template type. It is being used by ${templatesUsingType} template(s).`
      };
    }

    const deletedTemplateType = await TemplateTypeSchema.findOneAndDelete({
      _id: templateTypeId
    });

    if (!deletedTemplateType) {
      return {
        success: false,
        message: 'Template type not found'
      };
    }

    logger.info(`Template type deleted successfully: ${templateTypeId}`);
    
    return {
      success: true,
      message: 'Template type deleted successfully'
    };
  } catch (error: any) {
    logger.error('Error deleting template type:', error);
    return {
      success: false,
      message: 'Failed to delete template type',
      error: error.message
    };
  }
};
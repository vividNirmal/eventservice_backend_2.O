// domain/models/exhibitorFormParticular.model.ts
import { loggerMsg } from "../../lib/logger";
import { env } from "../../../infrastructure/env";
import ExhibitorFormParticularSchema, {
  IExhibitorFormParticular,
} from "../schema/exhibitorFormParticular.schema";
import mongoose from "mongoose";

/**
 * Add URLs to file fields
 */
const addFileUrls = (exhibitorFormParticular: any) => {
  const baseUrl = env.BASE_URL;

  // Add URL for image
  if (exhibitorFormParticular?.image) {
    exhibitorFormParticular.image = `${baseUrl}/uploads/${exhibitorFormParticular.image}`;
  }

  // Add URLs for documents
  if (exhibitorFormParticular?.documents) {
    exhibitorFormParticular.documents =
      exhibitorFormParticular.documents.map((doc: any) => ({
        ...doc,
        url: `${baseUrl}/uploads/${doc.path}`,
      }));
  }

  return exhibitorFormParticular;
};

interface ExhibitorFormParticularFilterOptions {
  status?: "active" | "inactive";
  search?: string;
  exhibitorFormId?: string;
}

interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * Create new exhibitor form particular
 */
export const createExhibitorFormParticular = async (
  formData: Partial<IExhibitorFormParticular>,
  eventId: mongoose.Types.ObjectId,
  exhibitorFormId: mongoose.Types.ObjectId,
  companyId?: mongoose.Types.ObjectId
) => {
  try {
    console.log("Creating exhibitor form particular with data:", formData);

    // Check if particular with same name exists for this exhibitor form
    const existingParticular = await ExhibitorFormParticularSchema.findOne({
      ExhibitorForm: exhibitorFormId,
      item_name: formData.item_name,
    });

    if (existingParticular) {
      return {
        success: false,
        message: "Exhibitor form particular with this name already exists for this form",
      };
    }

    const newParticular = new ExhibitorFormParticularSchema({
      ...formData,
      companyId: companyId || null,
      eventId,
      ExhibitorForm: exhibitorFormId,
    });

    const savedParticular = await newParticular.save();
    const particularWithUrls = addFileUrls(savedParticular.toObject());

    loggerMsg("info", `Exhibitor form particular created: ${savedParticular._id}`);

    return {
      success: true,
      data: particularWithUrls,
      message: "Exhibitor form particular created successfully",
    };
  } catch (error: any) {
    console.log("Error creating exhibitor form particular:", error);
    loggerMsg("error", `Error creating exhibitor form particular: ${error.message}`);
    return {
      success: false,
      message: "Failed to create exhibitor form particular",
      error: error.message,
    };
  }
};

/**
 * Update exhibitor form particular
 */
export const updateExhibitorFormParticular = async (
  id: mongoose.Types.ObjectId,
  updateData: Partial<IExhibitorFormParticular>,
) => {
  try {
    console.log("Updating exhibitor form particular with data:", updateData);

    // Check if particular exists
    const existingParticular = await ExhibitorFormParticularSchema.findOne({
      _id: id,
    });

    if (!existingParticular) {
      return {
        success: false,
        message: "Exhibitor form particular not found or access denied",
      };
    }

    // Check name uniqueness if being updated
    if (
      updateData.item_name &&
      updateData.item_name !== existingParticular.item_name
    ) {
      const nameExists = await ExhibitorFormParticularSchema.findOne({
        _id: { $ne: id },
        ExhibitorForm: existingParticular.ExhibitorForm,
        item_name: updateData.item_name,
      });

      if (nameExists) {
        return {
          success: false,
          message:
            "Exhibitor form particular with this name already exists for this form",
        };
      }
    }

    const updatedParticular = await ExhibitorFormParticularSchema.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedParticular) {
      return {
        success: false,
        message: "Exhibitor form particular not found",
      };
    }

    const particularWithUrls = addFileUrls(updatedParticular.toObject());
    loggerMsg("info", `Exhibitor form particular updated: ${id}`);

    return {
      success: true,
      data: particularWithUrls,
      message: "Exhibitor form particular updated successfully",
    };
  } catch (error: any) {
    console.log("Error updating exhibitor form particular:", error);
    loggerMsg("error", `Error updating exhibitor form particular: ${error.message}`);
    return {
      success: false,
      message: "Failed to update exhibitor form particular",
      error: error.message,
    };
  }
};

/**
 * Get all exhibitor form particulars with pagination and filtering
 */
export const getAllExhibitorFormParticulars = async (
  filters: ExhibitorFormParticularFilterOptions = {},
  pagination: PaginationOptions = { page: 1, limit: 10 },
  eventId?: mongoose.Types.ObjectId,
  companyId?: mongoose.Types.ObjectId,
  exhibitorFormId?: mongoose.Types.ObjectId
) => {
  try {
    const { status, search, exhibitorFormId: filterExhibitorFormId } = filters;
    const { page, limit } = pagination;

    // Build search query
    const searchQuery: any = {};

    if (eventId) {
      searchQuery.eventId = eventId;
    }

    if (companyId) {
      searchQuery.companyId = companyId;
    }

    if (exhibitorFormId) {
      searchQuery.ExhibitorForm = exhibitorFormId;
    }

    if (filterExhibitorFormId) {
      searchQuery.ExhibitorForm = filterExhibitorFormId;
    }

    if (status) {
      searchQuery.status = status;
    }

    if (search) {
      searchQuery.$or = [
        { item_name: { $regex: search, $options: "i" } },
        { disclaimer: { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const totalCount = await ExhibitorFormParticularSchema.countDocuments(searchQuery);

    // Get particulars with pagination
    const particulars = await ExhibitorFormParticularSchema.find(searchQuery)
      .populate('ExhibitorForm')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Add file URLs to particulars
    const particularsWithUrls = particulars.map((particular) => addFileUrls(particular.toObject()));

    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      data: {
        particulars: particularsWithUrls,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
        },
      },
    };
  } catch (error: any) {
    loggerMsg("error", `Error fetching exhibitor form particulars: ${error.message}`);
    return {
      success: false,
      message: "Failed to fetch exhibitor form particulars",
      error: error.message,
    };
  }
};

/**
 * Get exhibitor form particular by ID
 */
export const getExhibitorFormParticularById = async (id: mongoose.Types.ObjectId) => {
  try {
    const particular = await ExhibitorFormParticularSchema.findById(id)
      .populate('ExhibitorForm');

    if (!particular) {
      return {
        success: false,
        message: "Exhibitor form particular not found",
      };
    }

    const particularWithUrls = addFileUrls(particular.toObject());

    return {
      success: true,
      data: particularWithUrls,
      message: "Exhibitor form particular fetched successfully",
    };
  } catch (error: any) {
    loggerMsg("error", `Error fetching exhibitor form particular: ${error.message}`);
    return {
      success: false,
      message: "Failed to fetch exhibitor form particular",
      error: error.message,
    };
  }
};

/**
 * Delete exhibitor form particular by ID
 */
export const deleteExhibitorFormParticular = async (id: mongoose.Types.ObjectId) => {
  try {
    const deletedParticular = await ExhibitorFormParticularSchema.findOneAndDelete({
      _id: id,
    });

    if (!deletedParticular) {
      return {
        success: false,
        message: "Exhibitor form particular not found or access denied",
      };
    }

    const particularWithUrls = addFileUrls(deletedParticular.toObject());

    loggerMsg("info", `Exhibitor form particular deleted: ${id}`);

    return {
      success: true,
      data: particularWithUrls,
      message: "Exhibitor form particular deleted successfully",
    };
  } catch (error: any) {
    loggerMsg("error", `Error deleting exhibitor form particular: ${error.message}`);
    return {
      success: false,
      message: "Failed to delete exhibitor form particular",
      error: error.message,
    };
  }
};

/**
 * Update exhibitor form particular status
 */
export const updateExhibitorFormParticularStatusModel = async (
  particularId: string,
  status: 'active' | 'inactive',
  callback: (error: any, result: any) => void
) => {
  try {
    const particular = await ExhibitorFormParticularSchema.findById(particularId);

    if (!particular) {
      return callback({ message: "Exhibitor form particular not found." }, null);
    }

    particular.status = status;

    await particular.save();

    return callback(null, {
      particularId: particular._id,
      status: particular.status,
      message: particular.status === 'active'
        ? "Exhibitor form particular activated."
        : "Exhibitor form particular deactivated.",
    });
  } catch (error) {
    return callback(error, null);
  }
};
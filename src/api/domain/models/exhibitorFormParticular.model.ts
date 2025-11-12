// domain/models/exhibitorFormParticular.model.ts
import { loggerMsg } from "../../lib/logger";
import { env } from "../../../infrastructure/env";
import ExhibitorFormParticularSchema, {
  IExhibitorFormParticular,
} from "../schema/exhibitorFormParticular.schema";
import mongoose from "mongoose";
import ExhibitorFormSchema from "../schema/exhibitorForm.schema";
import ExhibitorFormAssetSchema from "../schema/exhibitorFormAsset.schema";


const calculateTotalAllocatedQuantity = async (particular: any, eventId?: mongoose.Types.ObjectId) => {
  let totalQuantity = 0;

  if (eventId && particular.exhibitorFormId && particular.zones && particular.zones.length > 0) {
    try {
      // Get the exhibitor form to get the configuration ID
      const exhibitorForm = await ExhibitorFormSchema.findById(particular.exhibitorFormId);
      
      if (exhibitorForm && exhibitorForm.exhibitorFormConfigurationId) {
        // Get the asset allocation for this form configuration and event
        const assetAllocation = await ExhibitorFormAssetSchema.findOne({
          eventId: eventId,
          exhibitorFormConfigurationId: exhibitorForm.exhibitorFormConfigurationId
        }).populate('zones.zoneId');

        if (assetAllocation && assetAllocation.zones) {
          // Calculate total quantity for the zones assigned to this particular
          particular.zones.forEach((zone: any) => {
            const allocatedZone = assetAllocation.zones.find(
              (allocZone: any) => allocZone.zoneId._id.toString() === zone._id.toString()
            );
            if (allocatedZone) {
              totalQuantity += allocatedZone.quantity || 0;
            }
          });

          // Add zone asset quantities to the particular
          particular.zoneAssetQuantities = assetAllocation.zones
            .filter((zone: any) =>
              particular.zones.some((pZone: any) =>
                pZone._id.toString() === zone.zoneId._id.toString()
              )
            )
            .map((zone: any) => ({
              zoneId: zone.zoneId._id,
              zoneName: zone.zoneId.name,
              quantity: zone.quantity
            }));
        }
      }
    } catch (error) {
      console.error("Error calculating total allocated quantity:", error);
      particular.zoneAssetQuantities = [];
    }
  }

  particular.totalAllocatedQuantity = totalQuantity;
  return particular;
};


/**
 * Add URLs to file fields
 */
const addFileUrlsAndCalculateQuantity = async (exhibitorFormParticular: any, eventId?: mongoose.Types.ObjectId) => {
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

  // Calculate total allocated quantity
  exhibitorFormParticular = await calculateTotalAllocatedQuantity(exhibitorFormParticular, eventId);

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
      exhibitorFormId: exhibitorFormId,
      item_name: formData.item_name,
    });

    if (existingParticular) {
      return {
        success: false,
        message: "Exhibitor form particular with this name already exists for this form",
      };
    }

    // Parse zones if it's a JSON string
    if (formData.zones && typeof formData.zones === 'string') {
      try {
        formData.zones = JSON.parse(formData.zones);
      } catch (e) {
        console.error("Error parsing zones:", e);
        formData.zones = [];
      }
    }

    const newParticular = new ExhibitorFormParticularSchema({
      ...formData,
      companyId: companyId || null,
      eventId,
      exhibitorFormId: exhibitorFormId,
    });

    const savedParticular = await newParticular.save();
    const particularWithUrls = await addFileUrlsAndCalculateQuantity(savedParticular.toObject(), eventId);

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

    // Parse zones if it's a JSON string
    if (updateData.zones && typeof updateData.zones === 'string') {
      try {
        updateData.zones = JSON.parse(updateData.zones);
      } catch (e) {
        console.error("Error parsing zones:", e);
        updateData.zones = existingParticular.zones;
      }
    }

    // Check name uniqueness if being updated
    if (
      updateData.item_name &&
      updateData.item_name !== existingParticular.item_name
    ) {
      const nameExists = await ExhibitorFormParticularSchema.findOne({
        _id: { $ne: id },
        exhibitorFormId: existingParticular.exhibitorFormId,
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

    const particularWithUrls = await addFileUrlsAndCalculateQuantity(updatedParticular.toObject(), existingParticular.eventId);
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
    const { status, search } = filters;
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
      searchQuery.exhibitorFormId = exhibitorFormId;
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
      .populate('exhibitorFormId')
      .populate('zones') // Populate zone references
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Add file URLs and calculate total allocated quantity
    const particularsWithUrls = await Promise.all(
      particulars.map(async (particular) => 
        await addFileUrlsAndCalculateQuantity(particular.toObject(), eventId)
      )
    );

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
export const getExhibitorFormParticularById = async (id: mongoose.Types.ObjectId, eventId?: mongoose.Types.ObjectId) => {
  try {
    const particular = await ExhibitorFormParticularSchema.findById(id)
      .populate('exhibitorFormId')
      .populate('zones'); // Populate zone references

    if (!particular) {
      return {
        success: false,
        message: "Exhibitor form particular not found",
      };
    }

    const particularWithUrls = await addFileUrlsAndCalculateQuantity(particular.toObject(), eventId);

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

    const particularWithUrls = addFileUrlsAndCalculateQuantity(deletedParticular.toObject(), deletedParticular?.eventId);

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
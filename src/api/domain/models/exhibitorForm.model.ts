import { loggerMsg } from "../../lib/logger";
import { env } from "../../../infrastructure/env";
import ExhibitorFormSchema, {
  IExhibitorForm,
} from "../schema/exhibitorForm.schema";
import mongoose from "mongoose";

/**
 * Add URLs to file fields
 */
const addFileUrls = (exhibitorForm: any) => {
  const baseUrl = env.BASE_URL;

  // Add URL for important instructions image
  if (exhibitorForm?.mediaInfo?.important_instructions_image) {
    exhibitorForm.mediaInfo.important_instructions_image_url = `${baseUrl}/uploads/${exhibitorForm.mediaInfo.important_instructions_image}`;
  }

  // Add URLs for supporting documents
  if (exhibitorForm?.mediaInfo?.supporting_documents) {
    exhibitorForm.mediaInfo.supporting_documents =
      exhibitorForm.mediaInfo.supporting_documents.map((doc: any) => ({
        ...doc,
        url: `${baseUrl}/uploads/${doc.path}`,
      }));
  }

  return exhibitorForm;
};

/**
 * Parse JSON fields from string to object
 */
const parseJsonFields = (data: any) => {
  if (data.basicInfo && typeof data.basicInfo === "string") {
    try {
      data.basicInfo = JSON.parse(data.basicInfo);
    } catch (err) {
      throw new Error("Invalid JSON for basicInfo");
    }
  }

  if (data.otherInfo && typeof data.otherInfo === "string") {
    try {
      data.otherInfo = JSON.parse(data.otherInfo);
    } catch (err) {
      throw new Error("Invalid JSON for otherInfo");
    }
  }

  if (data.notifications && typeof data.notifications === "string") {
    try {
      data.notifications = JSON.parse(data.notifications);
    } catch (err) {
      throw new Error("Invalid JSON for notifications");
    }
  }

  return data;
};

interface ExhibitorFormFilterOptions {
  status?: "active" | "inactive" | "expired";
  search?: string;
  stallType?: string;
}

interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * Create new exhibitor form
 */
export const createExhibitorForm = async (
  formData: Partial<IExhibitorForm>,
  exhibitorFormConfigurationId: mongoose.Types.ObjectId,
  eventId: mongoose.Types.ObjectId,
  companyId?: mongoose.Types.ObjectId
) => {
  try {
    const parsedData = parseJsonFields(formData);

    // Check if form with same name exists for this event
    const existingForm = await ExhibitorFormSchema.findOne({
      eventId,
      exhibitorFormConfigurationId,
    });

    if (existingForm) {
      return {
        success: false,
        message: "Exhibitor form with this configuration already exists for this event",
      };
    }

    // Check if form name exists for this event
    if (parsedData.basicInfo?.full_name) {
      const existingFullName = await ExhibitorFormSchema.findOne({
        eventId,
        "basicInfo.full_name": parsedData.basicInfo.full_name,
      });

      if (existingFullName) {
        return {
          success: false,
          message:
            "Exhibitor form with this form name already exists for this event",
        };
      }
    }

    // Check if form number exists for this event
    if (parsedData.basicInfo?.form_number) {
      const existingFormNumber = await ExhibitorFormSchema.findOne({
        eventId,
        "basicInfo.form_number": parsedData.basicInfo.form_number,
      });

      if (existingFormNumber) {
        return {
          success: false,
          message:
            "Exhibitor form with this form number already exists for this event",
        };
      }
    }

    const newForm = new ExhibitorFormSchema({
      ...parsedData,
      companyId: companyId || null,
      eventId,
      exhibitorFormConfigurationId,
    });

    const savedForm = await newForm.save();
    const formWithUrls = addFileUrls(savedForm.toObject());

    loggerMsg("info", `Exhibitor form created: ${savedForm._id}`);

    return {
      success: true,
      data: formWithUrls,
      message: "Exhibitor form created successfully",
    };
  } catch (error: any) {
    console.log("error>>>>>>>>>>>>>>>>>>>>>>>", error);
    loggerMsg("error", `Error creating exhibitor form: ${error.message}`);
    return {
      success: false,
      message: "Failed to create exhibitor form",
      error: error.message,
    };
  }
};

/**
 * Update exhibitor form
 */
export const updateExhibitorForm = async (
  id: mongoose.Types.ObjectId,
  updateData: Partial<IExhibitorForm>,
) => {
  try {
    const parsedData = parseJsonFields(updateData);

    // Check if form exists and belongs to the company
    const existingForm = await ExhibitorFormSchema.findOne({
      _id: id,
    });

    if (!existingForm) {
      return {
        success: false,
        message: "Exhibitor form not found or access denied",
      };
    }

    // Check name uniqueness if being updated
    if (
      parsedData.basicInfo?.full_name &&
      parsedData.basicInfo.full_name !== existingForm.basicInfo.full_name
    ) {
      const nameExists = await ExhibitorFormSchema.findOne({
        _id: { $ne: id },
        eventId: existingForm.eventId,
        "basicInfo.full_name": parsedData.basicInfo.full_name,
      });

      if (nameExists) {
        return {
          success: false,
          message:
            "Exhibitor form with this name already exists for this event",
        };
      }
    }

    // Check form number uniqueness if being updated
    if (
      parsedData.basicInfo?.form_number &&
      parsedData.basicInfo.form_number !== existingForm.basicInfo.form_number
    ) {
      const formNumberExists = await ExhibitorFormSchema.findOne({
        _id: { $ne: id },
        eventId: existingForm.eventId,
        "basicInfo.form_number": parsedData.basicInfo.form_number,
      });

      if (formNumberExists) {
        return {
          success: false,
          message:
            "Exhibitor form with this form number already exists for this event",
        };
      }
    }

    const updatedForm = await ExhibitorFormSchema.findByIdAndUpdate(
      id,
      parsedData,
      { new: true, runValidators: true }
    );

    if (!updatedForm) {
      return {
        success: false,
        message: "Exhibitor form not found",
      };
    }

    const formWithUrls = addFileUrls(updatedForm.toObject());
    loggerMsg("info", `Exhibitor form updated: ${id}`);

    return {
      success: true,
      data: formWithUrls,
      message: "Exhibitor form updated successfully",
    };
  } catch (error: any) {
    console.log("error>>>>>>>>>>>>>>>>>>>>>>>", error);
    loggerMsg("error", `Error updating exhibitor form: ${error.message}`);
    return {
      success: false,
      message: "Failed to update exhibitor form",
      error: error.message,
    };
  }
};

/**
 * Get all exhibitor forms with pagination and filtering
 */
export const getAllExhibitorForms = async (
  filters: ExhibitorFormFilterOptions = {},
  pagination: PaginationOptions = { page: 1, limit: 10 },
  eventId?: mongoose.Types.ObjectId,
  companyId?: mongoose.Types.ObjectId
) => {
  try {
    const { status, search, stallType } = filters;
    const { page, limit } = pagination;

    // Build search query
    const searchQuery: any = {};

    if (eventId) {
      searchQuery.eventId = eventId;
    }

    if (companyId) {
      searchQuery.companyId = companyId;
    }

    if (status) {
      searchQuery.status = status;
    }

    if (stallType) {
      searchQuery["basicInfo.stall_type"] = stallType;
    }

    if (search) {
      searchQuery.$or = [
        { "basicInfo.full_name": { $regex: search, $options: "i" } },
        { "basicInfo.form_description": { $regex: search, $options: "i" } },
        { "basicInfo.stall_type": { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const totalCount = await ExhibitorFormSchema.countDocuments(searchQuery);

    // Get forms with pagination
    const forms = await ExhibitorFormSchema.find(searchQuery)
      .populate('exhibitorFormConfigurationId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Add file URLs to forms
    const formsWithUrls = forms.map((form) => addFileUrls(form.toObject()));

    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      data: {
        forms: formsWithUrls,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
        },
      },
    };
  } catch (error: any) {
    loggerMsg("error", `Error fetching exhibitor forms: ${error.message}`);
    return {
      success: false,
      message: "Failed to fetch exhibitor forms",
      error: error.message,
    };
  }
};

/**
 * Get exhibitor form by ID
 */
export const getExhibitorFormById = async (id: mongoose.Types.ObjectId) => {
  try {
    const form = await ExhibitorFormSchema.findOne({
      _id: id,
    });

    if (!form) {
      return {
        success: false,
        message: "Exhibitor form not found",
      };
    }

    const formWithUrls = addFileUrls(form.toObject());

    return {
      success: true,
      data: formWithUrls,
    };
  } catch (error: any) {
    loggerMsg("error", `Error fetching exhibitor form by ID: ${error.message}`);
    return {
      success: false,
      message: "Failed to fetch exhibitor form",
      error: error.message,
    };
  }
};

/**
 * Delete exhibitor form by ID
 */
export const deleteExhibitorForm = async (id: mongoose.Types.ObjectId) => {
  try {
    const deletedForm = await ExhibitorFormSchema.findOneAndDelete({
      _id: id,
    });

    if (!deletedForm) {
      return {
        success: false,
        message: "Exhibitor form not found or access denied",
      };
    }

    const formWithUrls = addFileUrls(deletedForm.toObject());

    loggerMsg("info", `Exhibitor form deleted: ${id}`);

    return {
      success: true,
      data: formWithUrls,
      message: "Exhibitor form deleted successfully",
    };
  } catch (error: any) {
    loggerMsg("error", `Error deleting exhibitor form: ${error.message}`);
    return {
      success: false,
      message: "Failed to delete exhibitor form",
      error: error.message,
    };
  }
};

/**
 * Get forms count by status
 */
export const getExhibitorFormsCountByStatus = async (
  eventId: mongoose.Types.ObjectId
) => {
  try {
    const matchQuery: any = { eventId };

    const counts = await ExhibitorFormSchema.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = counts.reduce((acc: any, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const total = await ExhibitorFormSchema.countDocuments(matchQuery);

    return {
      success: true,
      data: {
        ...result,
        total,
      },
    };
  } catch (error: any) {
    loggerMsg("error", `Error getting exhibitor forms count: ${error.message}`);
    return {
      success: false,
      message: "Failed to get exhibitor forms count",
      error: error.message,
    };
  }
};

/**
 * Bulk delete exhibitor forms
 */
export const bulkDeleteExhibitorForms = async (
  formIds: mongoose.Types.ObjectId[],
  eventId: mongoose.Types.ObjectId
) => {
  try {
    const deletedForms = await ExhibitorFormSchema.deleteMany({
      _id: { $in: formIds },
      eventId,
    });

    if (deletedForms.deletedCount === 0) {
      return {
        success: false,
        message: "No exhibitor forms found or access denied",
      };
    }

    loggerMsg(
      "info",
      `Bulk deleted ${deletedForms.deletedCount} exhibitor forms`
    );

    return {
      success: true,
      data: {
        deletedCount: deletedForms.deletedCount,
      },
      message: `Successfully deleted ${deletedForms.deletedCount} exhibitor form(s)`,
    };
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in bulk delete exhibitor forms: ${error.message}`
    );
    return {
      success: false,
      message: "Failed to delete exhibitor forms",
      error: error.message,
    };
  }
};


export const updateExhibitorFormStatusModel = async (
  formId: string,
  status: 'published' | 'unpublished',
  callback: (error: any, result: any) => void
) => {
  try {
    const form = await ExhibitorFormSchema.findById(formId);

    if (!form) {
      return callback({ message: "Exhibitor form not found." }, null);
    }

    form.status = status;

    await form.save();

    return callback(null, {
      formId: form._id,
      status: form.status,
      message: form.status
        ? "Exhibitor form published."
        : "Exhibitor form unpublished.",
    });
  } catch (error) {
    return callback(error, null);
  }
};

import { loggerMsg } from "../../lib/logger";
import exhibitorFormConfigurationSchema from "../schema/exhibitorFormConfiguration.schema";

export const createExhibitorFormConfiguration = async (
  data: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Check for existing record with same formNo or configSlug
    const existing = await exhibitorFormConfigurationSchema.findOne({
      $or: [{ formNo: data.formNo }, { configSlug: data.configSlug }],
    });

    if (existing) {
      return callback(
        new Error("Form configuration with this Form No or Slug already exists")
      );
    }

    const newConfig = new exhibitorFormConfigurationSchema(data);
    const savedConfig = await newConfig.save();

    callback(null, { config: savedConfig });
  } catch (error: any) {
    loggerMsg("error", `Error creating exhibitor form config: ${error}`);

    if (error.code === 11000) {
      return callback(new Error("Duplicate form configuration"));
    }

    callback(error, null);
  }
};

export const getAllExhibitorFormConfigurations = async (
  callback: (error: Error | null, result?: any) => void,
  page: number = 1,
  limit: number = 10,
  search?: string
) => {
  try {
    const skip = (page - 1) * limit;

    const searchQuery: any = {};
    if (search) {
      searchQuery.$or = [
        { configName: { $regex: search, $options: "i" } },
        { configSlug: { $regex: search, $options: "i" } },
        { formNo: { $regex: search, $options: "i" } },
      ];
    }

    const configs = await exhibitorFormConfigurationSchema
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalData = await exhibitorFormConfigurationSchema.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalData / limit);

    callback(null, {
      configs,
      pagination: {
        currentPage: page,
        totalPages,
        totalData,
        limit,
      },
    });
  } catch (error: any) {
    loggerMsg("error", `Error fetching exhibitor form configs: ${error}`);
    callback(error, null);
  }
};

export const getExhibitorFormConfigurationById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const config = await exhibitorFormConfigurationSchema.findById(id);
    if (!config) return callback(new Error("Form configuration not found"), null);

    callback(null, { config });
  } catch (error: any) {
    loggerMsg("error", `Error fetching config by ID: ${error}`);
    callback(error, null);
  }
};

export const updateExhibitorFormConfigurationById = async (
  id: string,
  updateData: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Check duplicates before updating
    if (updateData.formNo || updateData.configSlug) {
      const existing = await exhibitorFormConfigurationSchema.findOne({
        _id: { $ne: id },
        $or: [{ formNo: updateData.formNo }, { configSlug: updateData.configSlug }],
      });

      if (existing) {
        return callback(
          new Error("Form configuration with this Form No or Slug already exists")
        );
      }
    }

    const updatedConfig = await exhibitorFormConfigurationSchema.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedConfig)
      return callback(new Error("Form configuration not found"), null);

    callback(null, { config: updatedConfig });
  } catch (error: any) {
    loggerMsg("error", `Error updating form configuration: ${error}`);

    if (error.code === 11000) {
      return callback(new Error("Duplicate form configuration"));
    }

    callback(error, null);
  }
};

export const deleteExhibitorFormConfigurationById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const deletedConfig = await exhibitorFormConfigurationSchema.findByIdAndDelete(id);
    if (!deletedConfig)
      return callback(new Error("Form configuration not found"), null);

    callback(null, { config: deletedConfig });
  } catch (error: any) {
    loggerMsg("error", `Error deleting form configuration: ${error}`);
    callback(error, null);
  }
};

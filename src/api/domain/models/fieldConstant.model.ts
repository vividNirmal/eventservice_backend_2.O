import { loggerMsg } from "../../lib/logger";
import fieldConstantSchema from "../schema/FieldContant.schema"

export const createFieldConstant = async (
  data: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Check if field constant already exists
    const existingField = await fieldConstantSchema.findOne({
      param_name: data.param_name
    });


    if (existingField) {
      return callback(new Error("Field constant with this parameter name already exists"));
    }

    const newField = new fieldConstantSchema(data);
    const savedField = await newField.save();

    callback(null, { fieldConstant: savedField });
  } catch (error: any) {
    loggerMsg("error", `Error creating field constant: ${error}`);

    // Handle MongoDB duplicate key error (in case the unique index is triggered)
    if (error.code === 11000) {
      return callback(new Error("Field constant with this parameter name already exists"));
    }

    callback(error, null);
  }
};

export const getAllFieldConstants = async (
  callback: (error: Error | null, result?: any) => void,
  page: number = 1,
  limit: number = 10,
  search?: string
) => {
  try {
    const skip = (page - 1) * limit;

    const searchQuery: any = {};
    if (search) {
      searchQuery.param_name = { $regex: search, $options: "i" };
    }

    const fieldConstants = await fieldConstantSchema
      .find(searchQuery)
      .skip(skip)
      .limit(limit);

    const totalData = await fieldConstantSchema.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalData / limit);

    callback(null, {
      fieldConstants,
      pagination: {
        currentPage: page,
        totalPages,
        totalData,
        limit,
      },
    });
  } catch (error: any) {
    loggerMsg("error", `Error fetching field constants: ${error}`);
    callback(error, null);
  }
};

export const getFieldConstantById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const fieldConstant = await fieldConstantSchema.findById(id);
    if (!fieldConstant) return callback(new Error("Field constant not found"), null);

    callback(null, { fieldConstant });
  } catch (error: any) {
    loggerMsg("error", `Error fetching field constant by ID: ${error}`);
    callback(error, null);
  }
};

export const updateFieldConstantById = async (
  id: string,
  updateData: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Check if the update would create a duplicate
    if (updateData.param_name) {
      const existingField = await fieldConstantSchema.findOne({
        _id: { $ne: id }, // Exclude current document
        param_name: updateData.param_name
      });

      if (existingField) {
        return callback(new Error("Field constant with this parameter name already exists"));
      }
    }

    const updatedField = await fieldConstantSchema.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedField) return callback(new Error("Field constant not found"), null);

    callback(null, { fieldConstant: updatedField });
  } catch (error: any) {
    loggerMsg("error", `Error updating field constant: ${error}`);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return callback(new Error("Field constant with this parameter name already exists"));
    }

    callback(error, null);
  }
};

export const deleteFieldConstantById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const deletedField = await fieldConstantSchema.findByIdAndDelete(id);
    if (!deletedField) return callback(new Error("Field constant not found"), null);

    callback(null, { fieldConstant: deletedField });
  } catch (error: any) {
    loggerMsg("error", `Error deleting field constant: ${error}`);
    callback(error, null);
  }
};

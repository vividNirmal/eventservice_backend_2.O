import { loggerMsg } from "../../lib/logger";
import userTypeSchema from "../schema/userType.schema";

export const createUserTypeModule = async (
  data: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Check if user type already exists
    const existingType = await userTypeSchema.findOne({
      typeName: data.typeName,
    });

    if (existingType) {
      return callback(new Error("User type with this name already exists"));
    }

    const newType = new userTypeSchema(data);
    const savedType = await newType.save();

    callback(null, { userType: savedType });
  } catch (error: any) {
    loggerMsg("error", `Error creating user type: ${error}`);
    
    // Handle MongoDB duplicate key error (in case the unique index is triggered)
    if (error.code === 11000) {
      return callback(new Error("User type with this name already exists"));
    }
    
    callback(error, null);
  }
};

export const getAllUserTypes = async (
  callback: (error: Error | null, result?: any) => void,
  page: number = 1,
  limit: number = 10,
  search?: string,
  // companyId?: string,
) => {
  try {
    const skip = (page - 1) * limit;

    const searchQuery: any = {};
    if (search) {
      searchQuery.typeName = { $regex: search, $options: "i" };
    }

    // if (companyId) searchQuery.companyId = companyId;

    const userTypes = await userTypeSchema
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalData = await userTypeSchema.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalData / limit);

    callback(null, {
      userTypes,
      pagination: {
        currentPage: page,
        totalPages,
        totalData,
        limit,
      },
    });
  } catch (error: any) {
    loggerMsg("error", `Error fetching user types: ${error}`);
    callback(error, null);
  }
};

export const getUserTypeById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const userType = await userTypeSchema.findById(id);
    if (!userType) return callback(new Error("User type not found"), null);

    callback(null, { userType });
  } catch (error: any) {
    loggerMsg("error", `Error fetching user type by ID: ${error}`);
    callback(error, null);
  }
};

export const updateUserTypeById = async (
  id: string,
  updateData: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Check if the update would create a duplicate
    if (updateData.typeName || updateData.companyId) {
      const existingType = await userTypeSchema.findOne({
        _id: { $ne: id }, // Exclude current document
        typeName: updateData.typeName,
      });

      if (existingType) {
        return callback(new Error("User type with this name already exists"));
      }
    }

    const updatedType = await userTypeSchema.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    );

    if (!updatedType) return callback(new Error("User type not found"), null);

    callback(null, { userType: updatedType });
  } catch (error: any) {
    loggerMsg("error", `Error updating user type: ${error}`);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return callback(new Error("User type with this name already exists"));
    }
    
    callback(error, null);
  }
};

export const deleteUserTypeById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const deletedType = await userTypeSchema.findByIdAndDelete(id);
    if (!deletedType) return callback(new Error("User type not found"), null);

    callback(null, { userType: deletedType });
  } catch (error: any) {
    loggerMsg("error", `Error deleting user type: ${error}`);
    callback(error, null);
  }
};
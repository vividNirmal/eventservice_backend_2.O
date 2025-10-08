import { loggerMsg } from "../../lib/logger";
import userTypeMapSchema from "../schema/userTypeMap.schema";

// Create
export const createUserTypeMapModule = async (
  data: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Check uniqueness per company
    const existing = await userTypeMapSchema.findOne({
      userType: data.userType,
      companyId: data.companyId,
    });

    if (existing) {
      return callback(
        new Error("This user type is already mapped in this company")
      );
    }

    const newMap = new userTypeMapSchema(data);
    const saved = await newMap.save();

    callback(null, { userTypeMap: saved });
  } catch (error: any) {
    loggerMsg("error", `Error creating UserTypeMap: ${error}`);
    if (error.code === 11000) {
      return callback(
        new Error("This user type is already mapped in this company")
      );
    }
    callback(error, null);
  }
};

// Get all with pagination & search
export const getAllUserTypeMaps = async (
  callback: (error: Error | null, result?: any) => void,
  page: number = 1,
  limit: number = 10,
  search?: string,
  companyId?: string
) => {
  try {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (companyId) query.companyId = companyId;

    // Fetch with populate for userType
    const data = await userTypeMapSchema
      .find(query)
      .populate("userType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter in-memory if search exists (shortName OR userType.typeName)
    let filteredData = data;
    if (search) {
      const lowerSearch = search.toLowerCase();
      filteredData = data.filter(
        (item) =>
          item.shortName.toLowerCase().includes(lowerSearch) ||
          (item.userType as any)?.typeName?.toLowerCase().includes(lowerSearch)
      );
    }

    const total = filteredData.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedData = filteredData.slice(0, limit); // slice after filtering

    callback(null, {
      userTypeMaps: paginatedData,
      pagination: {
        currentPage: page,
        totalPages,
        totalData: total,
        limit,
      },
    });
  } catch (error: any) {
    loggerMsg("error", `Error fetching UserTypeMaps: ${error}`);
    callback(error, null);
  }
};

// Get by ID
export const getUserTypeMapById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const data = await userTypeMapSchema.findById(id).populate("userType");
    if (!data) return callback(new Error("UserTypeMap not found"), null);

    callback(null, { userTypeMap: data });
  } catch (error: any) {
    loggerMsg("error", `Error fetching UserTypeMap by ID: ${error}`);
    callback(error, null);
  }
};

// Update by ID
export const updateUserTypeMapById = async (
  id: string,
  updateData: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    if (updateData.userType || updateData.companyId) {
      const existing = await userTypeMapSchema.findOne({
        _id: { $ne: id },
        userType: updateData.userType,
        companyId: updateData.companyId,
      });
      if (existing) {
        return callback(
          new Error("This user type is already mapped in this company")
        );
      }
    }

    const updated = await userTypeMapSchema.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updated) return callback(new Error("UserTypeMap not found"), null);

    callback(null, { userTypeMap: updated });
  } catch (error: any) {
    loggerMsg("error", `Error updating UserTypeMap: ${error}`);
    if (error.code === 11000) {
      return callback(
        new Error("This user type is already mapped in this company")
      );
    }
    callback(error, null);
  }
};

// Delete by ID
export const deleteUserTypeMapById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const deleted = await userTypeMapSchema.findByIdAndDelete(id);
    if (!deleted) return callback(new Error("UserTypeMap not found"), null);

    callback(null, { userTypeMap: deleted });
  } catch (error: any) {
    loggerMsg("error", `Error deleting UserTypeMap: ${error}`);
    callback(error, null);
  }
};

import mongoose from "mongoose";
import { loggerMsg } from "../../lib/logger";
import defaultFieldSchema from "../schema/defaultField.schema";

interface DefaultField {
  fieldName: string;
  fieldType: string;
  isRequired: boolean;
  requiredErrorText: string;
  placeHolder: string;
  inputType: string;
  isPrimary: boolean;
  fieldOptions: any[];
  validators: { type: string; text: string; regex: string }[];
  userType: string;
  user_id: string;
  company_id: string;
  icon: string;
  fieldminLimit: string;
  fieldmaxLimit: string;
  specialCharactor: string;
  userFieldMapping :[],
  fieldPermission: String;
  isAdmin: boolean;
}

export const createDefaultFieldModule = async (
  formData: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    if (
      formData.fieldminLimit !== undefined ||
      formData.fieldmaxLimit !== undefined ||
      formData.specialCharactor !== undefined ||
      formData.fieldType !== undefined
    ) {
      formData.validators = buildValidator(formData);
    }

    // Handle isAdmin field - convert string to boolean if needed
    if (formData.isAdmin !== undefined) {
      formData.isAdmin = formData.isAdmin === 'true' || formData.isAdmin === true;
    }

    // Save document
    const newField = new defaultFieldSchema(formData);
    const savedField = await newField.save();

    callback(null, { field: savedField });
  } catch (error: any) {
    loggerMsg("error", `Error creating form: ${error}`);
    callback(error, null);
  }
};

export const getAllDefaultFields = async (
  callback: (error: Error | null, result?: any) => void,
  page: number = 1,
  limit: number = 10,
  search?: string,
  isAdmin?: boolean
) => {
  try {
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery: any[] = [];

    // Handle search condition
    if (search) {
      searchQuery.push({
        $or: [
          { fieldName: { $regex: search, $options: "i" } },
          { fieldType: { $regex: search, $options: "i" } },
          { fieldTitle: { $regex: search, $options: "i" } },
        ]
      });
    }

    // FIXED: Handle isAdmin filter properly
    if (isAdmin !== undefined) {
      if (isAdmin) {
        // Case 1: Only admin fields (isAdmin = true)
        searchQuery.push({ isAdmin: true });
      } else {
        // Case 2: Only user fields (isAdmin = false OR isAdmin doesn't exist)
        searchQuery.push({
          $or: [
            { isAdmin: false },
            { isAdmin: { $exists: false } },
            { isAdmin: null }
          ]
        });
      }
    }

    // Build final query
    const finalQuery = searchQuery.length > 0 ? { $and: searchQuery } : {};

    const fields = await defaultFieldSchema
      .find(finalQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const totalData = await defaultFieldSchema.countDocuments(finalQuery);
    const totalPages = Math.ceil(totalData / limit);
    callback(null, {
      fields,
      totalData,
      currentPage: page,
      totalPages,
    });
  } catch (error: any) {
    loggerMsg("error", `Error fetching default fields: ${error}`);
    callback(error, null);
  }
};

export const getDefaultFieldById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const field = await defaultFieldSchema.findById(id);
    if (!field) {
      return callback(new Error("Field not found"), null);
    }
    callback(null, { field });
  } catch (error: any) {
    loggerMsg("error", `Error fetching default field by ID: ${error}`);
    callback(error, null);
  }
};

export const updateDefaultFieldById = async (
  id: string,
  updateData: Partial<DefaultField>,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // If any validation-related fields are updated, rebuild regex
    if (
      updateData.fieldminLimit !== undefined ||
      updateData.fieldmaxLimit !== undefined ||
      updateData.specialCharactor !== undefined
    ) {
      updateData.validators = buildValidator(updateData);
    }

    // // Handle isAdmin field - convert string to boolean if needed
    // if (updateData.isAdmin !== undefined) {
    //   updateData.isAdmin = updateData.isAdmin === 'true' || updateData.isAdmin === true;
    // }

    const updatedField = await defaultFieldSchema.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    if (!updatedField) {
      return callback(new Error("Field not found"), null);
    }

    callback(null, { field: updatedField });
  } catch (error: any) {
    loggerMsg("error", `Error updating default field by ID: ${error}`);
    callback(error, null);
  }
};

// get by UserType
export const getDefaultFieldByUserType = async (
  userType: any,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    // Only return non-admin fields for user types
    const field = await defaultFieldSchema.find({
      userType: userType,
      isAdmin: { $ne: true } // Exclude admin fields
    });
    
    if (!field) {
      return callback(new Error("Field not found"), null);
    }
    callback(null, { field });
  } catch (error: any) {
    loggerMsg("error", `Error fetching default field by userType: ${error}`);
    callback(error, null);
  }
};

// Get admin default fields
export const getDefaultFieldForAdmin = async (
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const field = await defaultFieldSchema.find({ isAdmin: true });
    
    if (!field) {
      return callback(new Error("Admin fields not found"), null);
    }
    callback(null, { field });
  } catch (error: any) {
    loggerMsg("error", `Error fetching admin default fields: ${error}`);
    callback(error, null);
  }
};

// Delete Many by IDs
export const deleteManyDefaultFields = async (
  ids: string[],
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    if (!ids || ids.length === 0) {
      return callback(new Error("No IDs provided"), null);
    }

    // Ensure all IDs are valid ObjectIds
    const validIds = ids
      .map((id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null))
      .filter(Boolean);

    // if (validIds.length === 0) {
    //   return callback(new Error("No valid ObjectIds provided"), null);
    // }

    const result = await defaultFieldSchema.deleteMany({ _id: { $in: validIds } });

    if (result.deletedCount === 0) {
      return callback(new Error("No records deleted"), null);
    }

    callback(null, { message: "Records deleted successfully", deletedCount: result.deletedCount });
  } catch (error: any) {
    loggerMsg("error", `Error deleting default fields: ${error}`);
    callback(error, null);
  }
};


function buildValidator(data: any) {
  let regex = "";

  // ✅ Field type specific regex first
  switch (data.fieldType?.toLowerCase()) {
    case "email":
      regex = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
      break;
    case "url":
      regex = "^https?:\\/\\/[^\\s/$.?#].[^\\s]*$";
      break;
    case "password":
      regex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
      break;
    default: {
      // ✅ Generic regex based on min/max + specialCharactor
      let base = "^";

      if (
        data.specialCharactor === false ||
        data.specialCharactor?.toLowerCase() === "no"
      ) {
        base += "[a-zA-Z0-9";
      } else {
        base += "[\\s\\S"; // everything allowed
      }

      const min = Number(data.fieldminLimit) || 0;
      const max = Number(data.fieldmaxLimit) || "";
      base += `]{${min},${max}}$`;

      regex = base;
    }
  }

  return [
    {
      type: "custom",
      text: "Field validation",
      regex,
    },
  ];
}

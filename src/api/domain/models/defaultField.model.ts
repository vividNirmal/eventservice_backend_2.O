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
  fieldOptions: string[];
  validators: { type: string; text: string; regex: string }[];
  userType: string;
  user_id: string;
  company_id: string;
  icon: string;
  fieldminLimit: string;
  fieldmaxLimit: string;
  specialCharactor: string;
  userFieldMapping :[],
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
  search?: string
) => {
  try {
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery: any = {};
    if (search) {
      searchQuery.$or = [
        { formName: { $regex: search, $options: "i" } },
        { userType: { $regex: search, $options: "i" } },
      ];
    }
    const fields = await defaultFieldSchema
      .find({ ...searchQuery })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const totalData = await defaultFieldSchema.countDocuments(searchQuery);
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
  userType: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const field = await defaultFieldSchema.find({userType : userType});
    if (!field) {
      return callback(new Error("Field not found"), null);
    }
    callback(null, { field });
  } catch (error: any) {
    loggerMsg("error", `Error fetching default field by userType: ${error}`);
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

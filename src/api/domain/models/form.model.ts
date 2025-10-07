import mongoose from "mongoose";
import { loggerMsg } from "../../lib/logger";
import FormSchema, { IForm } from "../schema/form.schema";
import DefaultFieldSchema from "../schema/defaultField.schema";

interface FormData {
  formName: string;
  userType: string;
  pages:any[];
  formFields?: any[];
  companyId?: string;
  eventId?: string;
}

interface UpdateFormData extends FormData {
  formId: string;
}

interface DeleteFormData {
  formId: string;
}

export const getAllForms = async (
  callback: (error: any, result: any) => void,
  page: number = 1,
  limit: number = 10,
  search?: string,
  userType?: string,
  eventId?: string
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

    // Add userType filter if provided
    if (userType) {
      searchQuery.userType = userType;
    }
    // Add eventId filter if provided
    if (eventId) {
      searchQuery.eventId = new mongoose.Types.ObjectId(eventId);
    }
    // Get total count for pagination
    const totalCount = await FormSchema.countDocuments(searchQuery);

    // Get forms with pagination
    const forms = await FormSchema.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("formName userType formFields createdAt updatedAt");

    const totalPages = Math.ceil(totalCount / limit);

    return callback(null, {
      forms,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error getting forms:", error);
    loggerMsg("error", `Error getting forms: ${error}`);
    return callback(error, null);
  }
};

export const getFormById = async (
  formId: string,
  callback: (error: any, result: any) => void
) => {
  try {
    const form = await FormSchema.findById(formId);

    if (!form) {
      return callback(new Error("Form not found"), null);
    }

    return callback(null, { form });
  } catch (error) {
    console.error("Error getting form by ID:", error);
    loggerMsg("error", `Error getting form by ID: ${error}`);
    return callback(error, null);
  }
};

export const createForm = async (
  formData: FormData,
  callback: (error: any, result: any) => void
) => {
  try {
    // Fetch default fields for the specified userType
    const defaultFields = await DefaultFieldSchema.find({
      userFieldMapping: formData.userType,
    }).lean();

    // Transform default fields to form elements
    const defaultElements = defaultFields.map((field:any) => ({
      fieldPermission:"DEFAULT_FIELD_NON_REMOVED",
      ...field,
    }));

    // Prepare pages array
    let pages = formData.pages || [];

    // If no pages exist, create a default page with default fields
    if (pages.length === 0 ) {
      pages = [
        {
          name: "Page 1",
          description: "Default page with user-specific fields",
          elements: defaultElements || [],
        },
      ];
    } else if (pages.length > 0) {
      // Add default fields to the first page's elements array
      pages[0].elements = [...(pages[0].elements || []), ...defaultElements];
    }

    const newForm = new FormSchema({
      formName: formData.formName,
      userType: formData.userType,
      pages: pages,
      formFields: formData.formFields || [],
      companyId: formData?.companyId || null,
      eventId: formData?.eventId || null,
    });
    const savedForm = await newForm.save();
    return callback(null, { form: savedForm });
  } catch (error) {
    console.error("Error creating form:", error);
    loggerMsg("error", `Error creating form: ${error}`);
    return callback(error, null);
  }
};

export const updateForm = async (
  updateData: UpdateFormData,
  callback: (error: any, result: any) => void
) => {
  try {
    const { formId, ...updateFields } = updateData;

    const updatedForm = await FormSchema.findByIdAndUpdate(
      formId,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedForm) {
      return callback(new Error("Form not found"), null);
    }

    return callback(null, { form: updatedForm });
  } catch (error) {
    console.error("Error updating form:", error);
    loggerMsg("error", `Error updating form: ${error}`);
    return callback(error, null);
  }
};

export const deleteForm = async (
  deleteData: DeleteFormData,
  callback: (error: any, result: any) => void
) => {
  try {
    const deletedForm = await FormSchema.findByIdAndDelete(deleteData.formId);

    if (!deletedForm) {
      return callback(new Error("Form not found"), null);
    }

    return callback(null, { message: "Form deleted successfully" });
  } catch (error) {
    console.error("Error deleting form:", error);
    loggerMsg("error", `Error deleting form: ${error}`);
    return callback(error, null);
  }
};

export const addPageToForm = async (
  data: { formId: string; pageName: string; description?: string },
  callback: (err: any, result?: any) => void
) => {
  try {
    const { formId, pageName, description } = data;

    const updatedForm = await FormSchema.findByIdAndUpdate(
      formId,
      {
        $push: {
          pages: {
            name: pageName,
            description: description || "",
          },
        },
      },
      { new: true } // return updated document
    );

    if (!updatedForm) {
      return callback(new Error("Form not found"));
    }

    return callback(null, updatedForm);
  } catch (err) {
    return callback(err);
  }
};

// export form field 
export const exportFormPagesAsJson = async (
  formId: string,
  callback: (error: any, result: any) => void
) => {
  try {
    const form = await FormSchema.findById(formId).lean();
    if (!form) {
      return callback(new Error("Form not found"), null);
    }
    const jsonData = { pages: form.pages };
    return callback(null, jsonData);
  } catch (error) {
    console.error("Error exporting form pages:", error);
    loggerMsg("error", `Error exporting form pages: ${error}`);
    return callback(error, null);
  }
};
// import Fromfield 
export const importFormPagesFromJson = async (
  formId: string,
  file: Express.Multer.File,
  callback: (error: any, result: any) => void
) => {
  try {
    if (!file) {
      return callback(new Error("No file uploaded"), null);
    }

    // Parse JSON from uploaded file buffer
    const jsonString = file.buffer.toString("utf-8");
    let jsonData;
    try {
      jsonData = JSON.parse(jsonString);
    } catch (parseErr) {
      return callback(new Error("Invalid JSON file"), null);
    }

    if (!jsonData || !Array.isArray(jsonData.data.pages)) {
      return callback(
        new Error("Invalid JSON data: 'pages' array missing"),
        null
      );
    }    
    const existingForm = await FormSchema.findById(formId);
    if (!existingForm) {
      return callback(new Error("Form not found"), null);
    }    
    for (const importedPage of jsonData.data.pages) {
      // Find if page with same name exists
      const pageIndex = existingForm.pages.findIndex(
        (page: any) => page.name === importedPage.name
      );

      if (pageIndex !== -1) {
        // ✅ Append (push) imported elements to existing ones
        const existingElements = existingForm.pages[pageIndex].elements || [];
        const importedElements = importedPage.elements || [];

        // Optionally avoid duplicates by _id (if needed)
        const existingIds = new Set(
          existingElements.map((el: any) => el._id?.toString())
        );
        const newElements = importedElements.filter(
          (el: any) => !existingIds.has(el._id?.toString())
        );

        existingForm.pages[pageIndex].elements = [
          ...existingElements,
          ...newElements,
        ];

        // Update description if provided
        if (importedPage.description) {
          existingForm.pages[pageIndex].description = importedPage.description;
        }
      } else {
        // Add new page if not found
        existingForm.pages.push(importedPage);
      }
    }

    // Save updated form
    const updatedForm = await existingForm.save();

    return callback(null, { form: updatedForm });
  } catch (error) {
    console.error("Error importing form pages:", error);
    loggerMsg("error", `Error importing form pages: ${error}`);
    return callback(error, null);
  }
};

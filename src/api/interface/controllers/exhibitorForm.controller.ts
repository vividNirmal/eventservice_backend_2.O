import { Request, Response } from "express";
import {
  createExhibitorForm,
  updateExhibitorForm,
  getAllExhibitorForms,
  getExhibitorFormById,
  deleteExhibitorForm,
  getExhibitorFormsCountByStatus,
  bulkDeleteExhibitorForms,
} from "../../domain/models/exhibitorForm.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";
import mongoose from "mongoose";
import exhibitorFormSchema from "../../domain/schema/exhibitorForm.schema";

/**
 * Create new exhibitor form
 */
export const createExhibitorFormController = async (
  req: Request,
  res: Response
) => {
  console.log("here>>>>>>>>>");
  try {
    const companyId = req.body?.companyId;
    const eventId = req.body?.eventId;
    const formData = req.body;
    const files = req.files as Express.Multer.File[];

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        status: 0,
        message: "Valid Event ID is required",
      });
    }

    // Handle uploaded files
    if (files && Array.isArray(files)) {
      files.forEach((file) => {
        if (file.fieldname === "important_instructions_image") {
          formData.mediaInfo = formData.mediaInfo || {};
          formData.mediaInfo.important_instructions_image = `${
            (file as any).uploadFolder
          }/${file.filename}`;
        } else if (file.fieldname.startsWith("supporting_documents")) {
          // Handle supporting documents - they come as supporting_documents[0][file], supporting_documents[1][file], etc.
          formData.mediaInfo = formData.mediaInfo || {};
          formData.mediaInfo.supporting_documents =
            formData.mediaInfo.supporting_documents || [];

          // Extract index from fieldname
          const match = file.fieldname.match(
            /supporting_documents\[(\d+)\]\[file\]/
          );
          if (match) {
            const index = parseInt(match[1]);
            // Ensure the array has enough elements
            while (formData.mediaInfo.supporting_documents.length <= index) {
              formData.mediaInfo.supporting_documents.push({});
            }
            formData.mediaInfo.supporting_documents[index].path = `${
              (file as any).uploadFolder
            }/${file.filename}`;
          }
        }
      });
    }

    // Handle supporting document names directly from form-data fields
    if (formData.supporting_documents && Array.isArray(formData.supporting_documents)) {
      formData.mediaInfo = formData.mediaInfo || {};
      formData.mediaInfo.supporting_documents =
        formData.mediaInfo.supporting_documents || [];

      formData.supporting_documents.forEach((doc: any, index: number) => {
        // ensure array size
        while (formData.mediaInfo.supporting_documents.length <= index) {
          formData.mediaInfo.supporting_documents.push({});
        }
        formData.mediaInfo.supporting_documents[index].name = doc.name;
      });

      delete formData.supporting_documents; // cleanup
    }


    const result = await createExhibitorForm(
      formData,
      new mongoose.Types.ObjectId(eventId),
      companyId ? new mongoose.Types.ObjectId(companyId) : undefined
    );

    if (result.success) {
      return res.status(201).json({
        status: 1,
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(400).json({
        status: 0,
        message: result.message || "Failed to create exhibitor form",
      });
    }
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in createExhibitorFormController: ${error.message}`
    );
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};


export const updateExhibitorFormController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const files = req.files as Express.Multer.File[];

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 0,
        message: "Invalid exhibitor form ID",
      });
    }

    // Remove system fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;
    delete updateData.companyId; // Prevent changing the company
    delete updateData.eventId; // Prevent changing the event

    // Handle uploaded files
    if (files && Array.isArray(files)) {
      files.forEach((file) => {
        if (file.fieldname === "important_instructions_image") {
          updateData.mediaInfo = updateData.mediaInfo || {};
          updateData.mediaInfo.important_instructions_image = `${
            (file as any).uploadFolder
          }/${file.filename}`;
        } else if (file.fieldname.startsWith("supporting_documents")) {
          updateData.mediaInfo = updateData.mediaInfo || {};
          updateData.mediaInfo.supporting_documents =
            updateData.mediaInfo.supporting_documents || [];

          const match = file.fieldname.match(
            /supporting_documents\[(\d+)\]\[file\]/
          );
          if (match) {
            const index = parseInt(match[1]);
            while (updateData.mediaInfo.supporting_documents.length <= index) {
              updateData.mediaInfo.supporting_documents.push({});
            }
            updateData.mediaInfo.supporting_documents[index].path = `${
              (file as any).uploadFolder
            }/${file.filename}`;
          }
        }
      });
    }


    // Handle supporting document names directly from form-data fields
    if (updateData.supporting_documents && Array.isArray(updateData.supporting_documents)) {
      updateData.mediaInfo = updateData.mediaInfo || {};
      updateData.mediaInfo.supporting_documents =
        updateData.mediaInfo.supporting_documents || [];

      updateData.supporting_documents.forEach((doc: any, index: number) => {
        while (updateData.mediaInfo.supporting_documents.length <= index) {
          updateData.mediaInfo.supporting_documents.push({});
        }
        updateData.mediaInfo.supporting_documents[index].name = doc.name;
      });

      delete updateData.supporting_documents;
    }


    const result = await updateExhibitorForm(
      new mongoose.Types.ObjectId(id),
      updateData
    );

    if (result.success) {
      return res.status(200).json({
        status: 1,
        message: result.message,
        data: result.data,
      });
    } else {
      const statusCode =
        result.message === "Exhibitor form not found or access denied"
          ? 404
          : 400;
      return res.status(statusCode).json({
        status: 0,
        message: result.message || "Failed to update exhibitor form",
      });
    }
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in updateExhibitorFormController: ${error.message}`
    );
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};


/**
 * Get all exhibitor forms
 */
export const getAllExhibitorFormsController = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      stallType,
      eventId,
      companyId,
    } = req.query;

    const filters = {
      ...(status && { status: status as "active" | "inactive" | "expired" }),
      ...(search && { search: search as string }),
      ...(stallType && { stallType: stallType as string }),
    };

    const pagination = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };

    const result = await getAllExhibitorForms(
      filters,
      pagination,
      eventId ? new mongoose.Types.ObjectId(eventId as string) : undefined,
      companyId ? new mongoose.Types.ObjectId(companyId as string) : undefined
    );

    if (result.success) {
      return successResponse(
        res,
        "Exhibitor forms fetched successfully",
        result.data
      );
    } else {
      return res.status(400).json({
        status: 0,
        message: result.message || "Failed to fetch exhibitor forms",
      });
    }
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in getAllExhibitorFormsController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

/**
 * Get exhibitor form by ID
 */
export const getExhibitorFormByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 0,
        message: "Invalid exhibitor form ID",
      });
    }

    const result = await getExhibitorFormById(new mongoose.Types.ObjectId(id));

    if (result.success) {
      return successResponse(
        res,
        "Exhibitor form fetched successfully",
        result.data
      );
    } else {
      return res.status(404).json({
        status: 0,
        message: result.message,
      });
    }
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in getExhibitorFormByIdController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

/**
 * Delete exhibitor form by ID
 */
export const deleteExhibitorFormByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 0,
        message: "Invalid exhibitor form ID",
      });
    }

    const result = await deleteExhibitorForm(new mongoose.Types.ObjectId(id));

    if (result.success) {
      return successResponse(res, result.message, result.data);
    } else {
      return res.status(404).json({
        status: 0,
        message: result.message,
      });
    }
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in deleteExhibitorFormByIdController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

/**
 * Bulk delete exhibitor forms
 */
export const bulkDeleteExhibitorFormsController = async (
  req: Request,
  res: Response
) => {
  try {
    const { formIds } = req.body;
    const companyId = req.body.companyId;

    // Validate input
    if (!Array.isArray(formIds) || formIds.length === 0) {
      return res.status(400).json({
        status: 0,
        message: "Invalid form IDs array",
      });
    }

    if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        status: 0,
        message: "Valid Company ID is required",
      });
    }

    // Validate all form IDs
    const invalidIds = formIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      return res.status(400).json({
        status: 0,
        message: `Invalid form IDs: ${invalidIds.join(", ")}`,
      });
    }

    // Convert to ObjectIds
    const objectIds = formIds.map((id) => new mongoose.Types.ObjectId(id));

    const result = await bulkDeleteExhibitorForms(
      objectIds,
      new mongoose.Types.ObjectId(companyId)
    );

    if (result.success) {
      return successResponse(res, result.message, result.data);
    } else {
      return res.status(400).json({
        status: 0,
        message: result.message,
      });
    }
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in bulkDeleteExhibitorFormsController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

/**
 * Get exhibitor forms count by status
 */
export const getExhibitorFormsCountController = async (
  req: Request,
  res: Response
) => {
  try {
    const { eventId } = req.query;

    const result = await getExhibitorFormsCountByStatus(
      new mongoose.Types.ObjectId(eventId as string)
    );

    if (result.success) {
      return successResponse(
        res,
        "Exhibitor forms count fetched successfully",
        result.data
      );
    } else {
      return res.status(400).json({
        status: 0,
        message: result.message,
      });
    }
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in getExhibitorFormsCountController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

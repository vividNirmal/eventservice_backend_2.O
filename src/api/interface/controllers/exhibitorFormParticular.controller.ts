// controllers/exhibitorFormParticular.controller.ts
import { Request, Response } from "express";
import {
  createExhibitorFormParticular,
  updateExhibitorFormParticular,
  getAllExhibitorFormParticulars,
  getExhibitorFormParticularById,
  deleteExhibitorFormParticular,
  updateExhibitorFormParticularStatusModel,
} from "../../domain/models/exhibitorFormParticular.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";
import mongoose from "mongoose";
import exhibitorFormParticularSchema from "../../domain/schema/exhibitorFormParticular.schema";

/**
 * Create new exhibitor form particular
 */
export const createExhibitorFormParticularController = async (
  req: Request,
  res: Response
) => {
  try {
    const companyId = req.body?.companyId;
    const eventId = req.body?.eventId;
    const exhibitorFormId = req.body?.exhibitorFormId;
    const formData = req.body;
    const files = req.files as Express.Multer.File[];

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        status: 0,
        message: "Valid Event ID is required",
      });
    }

    // Validate exhibitorForm ID
    if (!exhibitorFormId || !mongoose.Types.ObjectId.isValid(exhibitorFormId)) {
      return res.status(400).json({
        status: 0,
        message: "Valid Exhibitor Form ID is required",
      });
    }

    // Handle image
    const imageFile = files?.find(f => f.fieldname === 'image');
    if (imageFile) {
      formData.image = `${(imageFile as any).uploadFolder}/${imageFile.filename}`;
    }

    // Handle documents with metadata
    if (formData.documents_metadata) {
      let metadata;
      try {
        metadata = JSON.parse(formData.documents_metadata);
      } catch (e) {
        console.error("Error parsing documents_metadata:", e);
        metadata = [];
      }

      console.log("Documents metadata:", metadata);

      // Get uploaded files
      const uploadedFiles = files?.filter(f => f.fieldname === 'documents_files') || [];
      
      // Build documents array
      formData.documents = [];

      // Map files to metadata
      metadata.forEach((item: any) => {
        if (item.action === 'new' && uploadedFiles[item.fileIndex]) {
          const file = uploadedFiles[item.fileIndex];
          formData.documents.push({
            name: item.name,
            path: `${(file as any).uploadFolder}/${file.filename}`
          });
          console.log(`Added new document: ${item.name}`);
        }
      });

      // Clean up
      delete formData.documents_metadata;
    } else {
      // Initialize empty array if no documents
      formData.documents = [];
    }

    console.log("Final form data:", JSON.stringify(formData, null, 2));

    const result = await createExhibitorFormParticular(
      formData,
      new mongoose.Types.ObjectId(eventId),
      new mongoose.Types.ObjectId(exhibitorFormId),
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
        message: result.message || "Failed to create exhibitor form particular",
      });
    }
  } catch (error: any) {
    console.error("Error in createExhibitorFormParticularController:", error);
    loggerMsg(
      "error",
      `Error in createExhibitorFormParticularController: ${error.message}`
    );
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};

/**
 * Update exhibitor form particular
 */
export const updateExhibitorFormParticularController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const files = req.files as Express.Multer.File[];

    console.log("=== UPDATE EXHIBITOR FORM PARTICULAR DEBUG START ===");
    console.log("Raw updateData received:", Object.keys(updateData));
    console.log("Files received:", files?.map(f => ({ fieldname: f.fieldname, filename: f.filename })));

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 0,
        message: "Invalid exhibitor form particular ID",
      });
    }

    // Get the existing particular first to preserve existing data
    const existingParticular = await exhibitorFormParticularSchema.findById(id);
    if (!existingParticular) {
      return res.status(404).json({
        status: 0,
        message: "Exhibitor form particular not found",
      });
    }

    console.log("Existing particular data:", JSON.stringify(existingParticular, null, 2));

    // Remove system fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;
    delete updateData.companyId;
    delete updateData.eventId;
    delete updateData.exhibitorFormId;

    // Start with existing data
    const finalData = {
      ...existingParticular.toObject(),
      ...updateData,
      documents: [...(existingParticular.documents || [])]
    };

    // Handle image
    const imageFile = files?.find(f => f.fieldname === 'image');
    if (imageFile) {
      // New image uploaded - replace existing
      finalData.image = `${(imageFile as any).uploadFolder}/${imageFile.filename}`;
      console.log("New image uploaded:", finalData.image);
    } else {
      // No new image - keep existing from database
      console.log("Keeping existing image:", finalData.image);
    }

    // Handle documents with metadata approach
    if (updateData.documents_metadata) {
      let metadata;
      try {
        metadata = JSON.parse(updateData.documents_metadata);
      } catch (e) {
        metadata = updateData.documents_metadata;
      }

      console.log("Documents metadata:", metadata);

      // Get uploaded files
      const uploadedFiles = files?.filter(f => f.fieldname === 'documents_files') || [];
      
      // Build new documents array
      const newDocuments: any[] = [];
      let fileIndex = 0;

      metadata.forEach((item: any) => {
        if (item.action === 'delete') {
          // Skip deleted documents
          console.log(`Deleting document with path: ${item.path}`);
        } else if (item.action === 'new') {
          // Add new uploaded file
          if (uploadedFiles[fileIndex]) {
            const file = uploadedFiles[fileIndex];
            newDocuments.push({
              name: item.name,
              path: `${(file as any).uploadFolder}/${file.filename}`
            });
            console.log(`Added new document: ${item.name}`);
            fileIndex++;
          }
        } else if (item.action === 'update') {
          // Update existing document (name changed)
          newDocuments.push({
            name: item.name,
            path: item.path
          });
          console.log(`Updated document name: ${item.name}`);
        } else if (item.action === 'keep') {
          // Keep existing document as is
          newDocuments.push({
            name: item.name,
            path: item.path
          });
          console.log(`Keeping document: ${item.name}`);
        }
      });

      finalData.documents = newDocuments;
      delete updateData.documents_metadata;
    }

    console.log("Final data to save:", JSON.stringify(finalData, null, 2));
    console.log("=== UPDATE EXHIBITOR FORM PARTICULAR DEBUG END ===");

    const result = await updateExhibitorFormParticular(
      new mongoose.Types.ObjectId(id),
      finalData
    );

    if (result.success) {
      return res.status(200).json({
        status: 1,
        message: result.message,
        data: result.data,
      });
    } else {
      const statusCode =
        result.message === "Exhibitor form particular not found or access denied"
          ? 404
          : 400;
      return res.status(statusCode).json({
        status: 0,
        message: result.message || "Failed to update exhibitor form particular",
      });
    }
  } catch (error: any) {
    console.error("Error in updateExhibitorFormParticularController:", error);
    loggerMsg(
      "error",
      `Error in updateExhibitorFormParticularController: ${error.message}`
    );
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};

/**
 * Get all exhibitor form particulars
 */
export const getAllExhibitorFormParticularsController = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      exhibitorFormId,
      eventId,
      companyId,
    } = req.query;

    const filters = {
      ...(status && { status: status as "active" | "inactive" }),
      ...(search && { search: search as string }),
      ...(exhibitorFormId && { exhibitorFormId: exhibitorFormId as string }),
    };

    const pagination = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };

    const result = await getAllExhibitorFormParticulars(
      filters,
      pagination,
      eventId ? new mongoose.Types.ObjectId(eventId as string) : undefined,
      companyId ? new mongoose.Types.ObjectId(companyId as string) : undefined,
      exhibitorFormId ? new mongoose.Types.ObjectId(exhibitorFormId as string) : undefined
    );

    if (result.success) {
      return successResponse(
        res,
        "Exhibitor form particulars fetched successfully",
        result.data
      );
    } else {
      return res.status(400).json({
        status: 0,
        message: result.message || "Failed to fetch exhibitor form particulars",
      });
    }
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in getAllExhibitorFormParticularsController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

/**
 * Get exhibitor form particular by ID
 */
export const getExhibitorFormParticularByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 0,
        message: "Invalid exhibitor form particular ID",
      });
    }

    const result = await getExhibitorFormParticularById(new mongoose.Types.ObjectId(id));

    if (result.success) {
      return successResponse(
        res,
        "Exhibitor form particular fetched successfully",
        result.data
      );
    } else {
      return res.status(404).json({
        status: 0,
        message: result.message || "Exhibitor form particular not found",
      });
    }
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in getExhibitorFormParticularByIdController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

/**
 * Delete exhibitor form particular by ID
 */
export const deleteExhibitorFormParticularByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 0,
        message: "Invalid exhibitor form particular ID",
      });
    }

    const result = await deleteExhibitorFormParticular(new mongoose.Types.ObjectId(id));

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
      `Error in deleteExhibitorFormParticularByIdController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

/**
 * Update exhibitor form particular status
 */
export const updateExhibitorFormParticularStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ status: 0, message: 'Invalid status value' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 0, message: 'Invalid ID' });
    }

    updateExhibitorFormParticularStatusModel(id, status, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(
        res,
        "Exhibitor form particular status updated successfully",
        result
      );
    });
  } catch (error) {
    return ErrorResponse(res, "Error updating exhibitor form particular status.");
  }
};
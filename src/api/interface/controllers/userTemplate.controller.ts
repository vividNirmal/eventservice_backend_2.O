import e, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { env } from "process";
import { successResponse, ErrorResponse } from "../../helper/apiResponse";
import {
  storeUserTemplate,
  userTemplateList,
  updateUserTemplate,
  getUserTemplateById,
  deleteUserTemplates
} from "../../domain/models/userTemplate.model";

interface FileWithBuffer extends Express.Multer.File {
  buffer: Buffer;
}

export const getUserTemplates = async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 10, search = "", type = "", eventId = "" } = req.query;

    userTemplateList(
      req.body,
      parseInt(page as string),
      parseInt(pageSize as string),
      search as string,
      type as string,
      eventId as string,
      (error: any, result: any) => {
        if (error) {
          return res.status(500).json({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred.",
          });
        }
        return successResponse(
          res,
          "User templates retrieved successfully",
          result
        );
      }
    );
  } catch (error) {
    return ErrorResponse(
      res,
      "An error occurred while fetching user templates."
    );
  }
};

export const createUserTemplate = async (req: Request, res: Response) => {
  try {
    // Handle file uploads for attachments (diskStorage)
    if (req.files && Array.isArray(req.files)) {
      const files = req.files as Express.Multer.File[];
      const attachments = files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        // store folder/filename relative to assets
        path: path.join("attachments", file.filename).replace(/\\/g, "/"),
        uploadedAt: new Date(),
      }));

      req.body.attachments = attachments;
    }

    // Parse defaultOption if it's a string (from FormData)
    if (req.body.defaultOption && typeof req.body.defaultOption === "string") {
      try {
        req.body.defaultOption = JSON.parse(req.body.defaultOption);
      } catch (err) {
        return ErrorResponse(res, "Invalid JSON string in defaultOption");
      }
    }

    // Set default status if not provided
    if (!req.body.status) {
      req.body.status = "active";
    }

    storeUserTemplate(req.body, (error: any, result: any) => {
      if (error) {
        return ErrorResponse(res, error.message);
      }

      return successResponse(res, "Template created successfully!", result);
    });
  } catch (error) {
    console.error("Error creating template:", error);
    return ErrorResponse(res, "An error occurred while creating template.");
  }
};

export const getUserTemplateDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    getUserTemplateById(id, (error: any, result: any) => {
      if (error) {
        return ErrorResponse(res, error.message);
      }

      // Add base URL to attachment paths
      if (result.attachments && result.attachments.length > 0) {
        const baseUrl = env.BASE_URL;
        result.attachments = result.attachments.map((attachment: any) => ({
          ...attachment,
          path: attachment.path,
        }));
      }

      return successResponse(
        res,
        "Template details retrieved successfully",
        result
      );
    });
  } catch (error) {
    return ErrorResponse(
      res,
      "An error occurred while fetching template details."
    );
  }
};

export const updateUserTemplateController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("=== DEBUG: Update Template Controller ===");
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);

    let allAttachments: any[] = [];

    // Handle existing attachments
    if (req.body.existingAttachments) {
      try {
        const existingAttachments = typeof req.body.existingAttachments === 'string' 
          ? JSON.parse(req.body.existingAttachments) 
          : req.body.existingAttachments;
        
        console.log("=== DEBUG: Existing Attachments ===");
        console.log(existingAttachments);

        // Validate existing attachments structure
        const validatedExistingAttachments = existingAttachments.map((att: any) => ({
          filename: att.filename,
          originalName: att.originalName,
          mimetype: att.mimetype,
          size: att.size,
          path: att.path,
          uploadedAt: att.uploadedAt ? new Date(att.uploadedAt) : new Date(),
        }));

        allAttachments = [...validatedExistingAttachments];
      } catch (parseError) {
        console.error('Error parsing existingAttachments:', parseError);
        return ErrorResponse(res, 'Invalid existingAttachments format');
      }
    }

    // Handle new file uploads
    if (req.files && Array.isArray(req.files)) {
      console.log("=== DEBUG: New Files ===");
      console.log(req.files);

      const files = req.files;
      const newAttachments = files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: path.join('attachments', file.filename).replace(/\\/g, '/'),
        uploadedAt: new Date(),
      }));

      allAttachments = [...allAttachments, ...newAttachments];
    }

    console.log("=== DEBUG: Final Attachments ===");
    console.log(allAttachments);

    req.body.attachments = allAttachments;

    // Parse other fields
    if (typeof req.body.defaultOption === 'string') {
      try {
        req.body.defaultOption = JSON.parse(req.body.defaultOption);
      } catch (error) {
        console.error('Error parsing defaultOption:', error);
        return ErrorResponse(res, 'Invalid defaultOption JSON format');
      }
    }

    req.body.templateId = id;

    updateUserTemplate(req.body, (error, result) => {
      if (error) {
        console.error('Error in updateUserTemplate:', error);
        return ErrorResponse(res, error.message);
      }
      return successResponse(res, 'Template updated successfully', result);
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return ErrorResponse(res, 'An error occurred while updating template.');
  }
};

export const deleteUserTemplateController = async (
  req: Request,
  res: Response
) => {
  try {
    const templateId = req.params.id;

    if (!templateId) {
      return ErrorResponse(
        res,
        "Please provide at least one valid template ID."
      );
    }

    deleteUserTemplates(templateId, (error: any, result: any) => {
      if (error) {
        return ErrorResponse(res, error.message);
      }

      return successResponse(res, result.message, result);
    });
  } catch (error) {
    return ErrorResponse(res, "An error occurred while deleting templates.");
  }
};
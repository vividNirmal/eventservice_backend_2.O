import { Request, Response } from 'express';
import {
  getReasonSectionModel,
  saveReasonSectionModel,
} from "../../domain/models/reasonSection.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";

/**
 * Get reason section by company ID
 */
export const getReasonSectionController = async (req: Request, res: Response) => {
  try {
    const { id: companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({
        status: 0,
        message: "Company ID is required",
      });
    }

    getReasonSectionModel(companyId as string, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Reason section fetched successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in getReasonSectionController: ${error.message}`);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};

/**
 * Create or update reason section
 */
export const saveReasonSectionController = async (req: Request, res: Response) => {
  try {
    const { companyId, title, description, existingImage, existingInfo } = req.body;
    
    // Files can be an array or object depending on multer configuration
    const filesArray = Array.isArray(req.files) 
      ? req.files 
      : Object.values(req.files || {}).flat();

    if (!companyId) {
      return res.status(400).json({
        status: 0,
        message: "Company ID is required",
      });
    }

    // Handle main image
    let mainImage = existingImage || "";
    const mainImageFile: any = filesArray.find((file: any) => file.fieldname === 'image');
    if (mainImageFile) {
      mainImage = `${mainImageFile.uploadFolder}/${mainImageFile.filename}`;
    }

    if (!mainImage) {
      return res.status(400).json({
        status: 0,
        message: "Main image is required",
      });
    }

    // Parse existing info items
    let infoItems = [];
    if (existingInfo) {
      try {
        infoItems = JSON.parse(existingInfo);
      } catch (error) {
        loggerMsg("error", "Failed to parse existing info items");
      }
    }

    // Process uploaded info images
    const infoImageFiles = filesArray.filter((file: any) => file.fieldname === 'infoImages');
    if (infoImageFiles.length > 0) {
      const infoImageIndexes = req.body.infoImageIndexes;
      const indexes = Array.isArray(infoImageIndexes) 
        ? infoImageIndexes 
        : [infoImageIndexes];

      infoImageFiles.forEach((file: any, fileIndex: number) => {
        const infoIndex = parseInt(indexes[fileIndex]);
        if (!isNaN(infoIndex) && infoItems[infoIndex]) {
          infoItems[infoIndex].info_image = `${file.uploadFolder}/${file.filename}`;
        }
      });
    }

    // Validate info items (both fields required if one is provided)
    for (let i = 0; i < infoItems.length; i++) {
      const item = infoItems[i];
      if (!item.info_image || !item.info_description || item.info_description.trim() === "") {
        return res.status(400).json({
          status: 0,
          message: `Info item ${i + 1}: Both image and description are required`,
        });
      }
    }

    const result = await saveReasonSectionModel({
      title,
      description: description || "",
      image: mainImage,
      info: infoItems,
      companyId
    });

    if (result.success) {
      return res.status(200).json({
        status: 1,
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(400).json({
        status: 0,
        message: result.message || "Failed to save reason section",
      });
    }
  } catch (error: any) {
    loggerMsg("error", `Error in saveReasonSectionController: ${error.message}`);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};
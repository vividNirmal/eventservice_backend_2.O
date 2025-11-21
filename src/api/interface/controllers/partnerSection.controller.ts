import { Request, Response } from 'express';
import {
  getPartnerSectionModel,
  savePartnerSectionModel,
} from "../../domain/models/partnerSection.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";

/**
 * Get partner section by company ID
 */
export const getPartnerSectionController = async (req: Request, res: Response) => {
  try {
    const { id: companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({
        status: 0,
        message: "Company ID is required",
      });
    }

    getPartnerSectionModel(companyId as string, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Partner section fetched successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in getPartnerSectionController: ${error.message}`);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};

/**
 * Create or update partner section
 */
export const savePartnerSectionController = async (req: Request, res: Response) => {
  try {
    const { companyId, title, existingPartners } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!companyId) {
      return res.status(400).json({
        status: 0,
        message: "Company ID is required",
      });
    }

    // Parse existing partners
    let partners = [];
    if (existingPartners) {
      try {
        partners = JSON.parse(existingPartners);
      } catch (error) {
        loggerMsg("error", "Failed to parse existing partners");
      }
    }

    // Process uploaded partner images
    if (files && Array.isArray(files)) {
      const partnerImageIndexes = req.body.partnerImageIndexes;
      const indexes = Array.isArray(partnerImageIndexes) 
        ? partnerImageIndexes 
        : [partnerImageIndexes];

      files.forEach((file, fileIndex) => {
        if (file.fieldname === "partnerImages") {
          const partnerIndex = parseInt(indexes[fileIndex]);
          if (!isNaN(partnerIndex) && partners[partnerIndex]) {
            partners[partnerIndex].image = `${file.uploadFolder}/${file.filename}`;
          }
        }
      });
    }

    const result = await savePartnerSectionModel({
      title,
      partners,
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
        message: result.message || "Failed to save partner section",
      });
    }
  } catch (error: any) {
    loggerMsg("error", `Error in savePartnerSectionController: ${error.message}`);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};
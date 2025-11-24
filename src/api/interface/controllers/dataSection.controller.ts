import { Request, Response } from 'express';
import {
  getDataSectionModel,
  saveDataSectionModel,
} from "../../domain/models/dataSection.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";

/**
 * Get data section by company ID
 */
export const getDataSectionController = async (req: Request, res: Response) => {
  try {
    const { id: companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({
        status: 0,
        message: "Company ID is required",
      });
    }

    getDataSectionModel(companyId as string, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Data section fetched successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in getDataSectionController: ${error.message}`);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};

/**
 * Create or update data section
 */
export const saveDataSectionController = async (req: Request, res: Response) => {
  try {
    const { companyId, title, existingBadges } = req.body;
    // const files = req.files as Express.Multer.File[];
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!companyId) {
      return res.status(400).json({
        status: 0,
        message: "Company ID is required",
      });
    }

    // Parse existing badges
    let badges = [];
    if (existingBadges) {
      try {
        badges = JSON.parse(existingBadges);
        
        // Ensure suffix field exists for all badges
        badges = badges.map((badge: any) => ({
          ...badge,
          suffix: badge.suffix || "", // Default to empty string if not provided
          value: Number(badge.value) || 0, // Ensure value is a number
        }));
      } catch (error) {
        loggerMsg("error", "Failed to parse existing badges");
      }
    }

    // Process uploaded badge images
    if (files && Array.isArray(files)) {
      const badgeImageIndexes = req.body.badgeImageIndexes;
      const indexes = Array.isArray(badgeImageIndexes) 
        ? badgeImageIndexes 
        : [badgeImageIndexes];

      files.forEach((file, fileIndex) => {
        if (file.fieldname === "badgeImages") {
        const badgeIndex = parseInt(indexes[fileIndex]);
        if (!isNaN(badgeIndex) && badges[badgeIndex]) {
          badges[badgeIndex].image = `${file.uploadFolder}/${file.filename}`;
          }
        }
      });
    }

    const result = await saveDataSectionModel({
      title,
      badges,
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
        message: result.message || "Failed to save data section",
      });
    }
  } catch (error: any) {
    loggerMsg("error", `Error in saveDataSectionController: ${error.message}`);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};
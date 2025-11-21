import { Request, Response } from 'express';
import {
  getHeroSectionModel,
  saveHeroSectionModel,
} from "../../domain/models/heroSection.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";

/**
 * Get hero section by company ID
 */
export const getHeroSectionController = async (req: Request, res: Response) => {
  try {
    const { id: companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({
        status: 0,
        message: "Company ID is required",
      });
    }

    getHeroSectionModel(companyId as string, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Hero section fetched successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in getHeroSectionController: ${error.message}`);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};

/**
 * Create or update hero section
 */
export const saveHeroSectionController = async (req: Request, res: Response) => {
  try {
    const { companyId, existingHeroes } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!companyId) {
      return res.status(400).json({
        status: 0,
        message: "Company ID is required",
      });
    }

    // Parse existing heroes
    let heroes = [];
    if (existingHeroes) {
      try {
        heroes = JSON.parse(existingHeroes);
      } catch (error) {
        loggerMsg("error", "Failed to parse existing heroes");
      }
    }

    // Process uploaded hero images
    if (files && Array.isArray(files)) {
      const heroImageIndexes = req.body.heroImageIndexes;
      const indexes = Array.isArray(heroImageIndexes) 
        ? heroImageIndexes 
        : [heroImageIndexes];

      files.forEach((file, fileIndex) => {
        if (file.fieldname === "heroImages") {
          const heroIndex = parseInt(indexes[fileIndex]);
          if (!isNaN(heroIndex) && heroes[heroIndex]) {
            heroes[heroIndex].image = `${file.uploadFolder}/${file.filename}`;
          }
        }
      });
    }

    const result = await saveHeroSectionModel({
      hero: heroes,
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
        message: result.message || "Failed to save hero section",
      });
    }
  } catch (error: any) {
    loggerMsg("error", `Error in saveHeroSectionController: ${error.message}`);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};
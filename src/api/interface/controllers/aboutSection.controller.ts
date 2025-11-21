import { Request, Response } from 'express';
import {
  getAboutSectionModel,
  saveAboutSectionModel,
} from "../../domain/models/aboutSection.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";

/**
 * Get about section by company ID
 */
export const getAboutSectionController = async (req: Request, res: Response) => {
  try {
    const { id: companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({
        status: 0,
        message: "Company ID is required",
      });
    }

    getAboutSectionModel(companyId as string, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "About section fetched successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in getAboutSectionController: ${error.message}`);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};

/**
 * Create or update about section
 */
export const saveAboutSectionController = async (req: Request, res: Response) => {
  try {
    const { companyId, title, description } = req.body;

    if (!companyId) {
      return res.status(400).json({
        status: 0,
        message: "Company ID is required",
      });
    }

    const aboutSectionData: any = {
      title,
      description,
      companyId
    };

    // Handle uploaded file
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files && Array.isArray(files)) {
      files.forEach((file) => {
        if (file.fieldname === "image") {
          aboutSectionData.image = `${file.uploadFolder}/${file.filename}`;
        }
      });
    }

    const result = await saveAboutSectionModel(aboutSectionData);

    if (result.success) {
      return res.status(200).json({
        status: 1,
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(400).json({
        status: 0,
        message: result.message || "Failed to save about section",
      });
    }
  } catch (error: any) {
    loggerMsg("error", `Error in saveAboutSectionController: ${error.message}`);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};
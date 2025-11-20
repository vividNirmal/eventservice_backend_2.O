import { Request, Response } from 'express';
import {
  createHeroSection,
  getAllHeroSections,
  getHeroSectionById,
  deleteHeroSectionById,
  updateHeroSection,
} from "../../domain/models/heroSection.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";
import mongoose from 'mongoose';

/**
 * Create new hero section
 */
export const createHeroSectionController = async (req: Request, res: Response) => {
  try {
    const companyId = req.body.companyId;
    const heroSectionData = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Handle uploaded file
    if (files && Array.isArray(files)) {
      files.forEach((file) => {
        if (file.fieldname === "image") {
          heroSectionData.image = `${file.uploadFolder}/${file.filename}`;
        }
      });
    }

    const result = await createHeroSection(heroSectionData, companyId);

    if (result.success) {
      return res.status(201).json({
        status: 1,
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(400).json({
        status: 0,
        message: result.message || "Failed to create hero section",
      });
    }
  } catch (error: any) {
    loggerMsg("error", `Error in createHeroSectionController: ${error.message}`);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};

/**
 * Update hero section
 */
export const updateHeroSectionController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.body.companyId;
    const updateData = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 0,
        message: "Invalid hero section ID",
      });
    }

    // Remove system fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;

    // Handle uploaded file
    if (files && Array.isArray(files)) {
      files.forEach((file) => {
        if (file.fieldname === "image") {
          updateData.image = `${file.uploadFolder}/${file.filename}`;
        }
      });
    }

    const result = await updateHeroSection(
      new mongoose.Types.ObjectId(id),
      updateData,
      companyId
    );

    if (result.success) {
      return res.status(200).json({
        status: 1,
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(404).json({
        status: 0,
        message: result.message || "Hero section not found",
      });
    }
  } catch (error: any) {
    loggerMsg("error", `Error in updateHeroSectionController: ${error.message}`);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};

/**
 * Get all hero sections with pagination and search
 */
export const getAllHeroSectionsController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const companyId = req.query.companyId as string;

    getAllHeroSections((error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Hero sections fetched successfully", result);
    }, page, limit, search, companyId);
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

/**
 * Get hero section by ID
 */
export const getHeroSectionByIdController = async (req: Request, res: Response) => {
  try {
    getHeroSectionById(req.params.id, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Hero section fetched successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

/**
 * Delete hero section by ID
 */
export const deleteHeroSectionByIdController = async (req: Request, res: Response) => {
  try {
    deleteHeroSectionById(req.params.id, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Hero section deleted successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};
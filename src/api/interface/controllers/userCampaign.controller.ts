// api/controllers/userCampaign.controller.js
import { Request, Response } from 'express';
import {
  createUserCampaign,
  getAllUserCampaigns,
  getUserCampaignById,
  deleteUserCampaignById,
  updateUserCampaign,
  sendCampaignNow,
} from "../../domain/models/userCampaign.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";
import mongoose from 'mongoose';

/**
 * Create new user campaign
 */
export const createUserCampaignController = async (req: Request, res: Response) => {
  try {

    const companyId = req.body.companyId;
    const eventId = req.body.eventId;
    const campaignData = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Handle uploaded Excel file
    let excelFilePath = '';

    if (files && Array.isArray(files)) {
      files.forEach((file) => {
        if (file.fieldname === "excelFile") {
          excelFilePath = `${file.uploadFolder}/${file.filename}`;
        }
      });
    }

    if (!excelFilePath) {
      return res.status(400).json({
        status: 0,
        message: "Excel file is required",
      });
    }

    const result = await createUserCampaign(campaignData, companyId, eventId, excelFilePath);

    if (result.success) {
      return res.status(201).json({
        status: 1,
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(400).json({
        status: 0,
        message: result.message || "Failed to create campaign",
      });
    }
  } catch (error: any) {
    console.log("error>>", error)
    loggerMsg("error", `Error in createUserCampaignController: ${error.message}`);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};

/**
 * Update user campaign
 */
export const updateUserCampaignController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 0,
        message: "Invalid campaign ID",
      });
    }

    const companyId = req.body.companyId;
    const updateData = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Remove system fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.__v;

    // Handle uploaded Excel file if provided
    let excelFilePath = '';
    if (files && Array.isArray(files)) {
      files.forEach((file) => {
        if (file.fieldname === "excelFile") {
          excelFilePath = `${file.uploadFolder}/${file.filename}`;
        }
      });
    }

    const result = await updateUserCampaign(
      new mongoose.Types.ObjectId(id),
      updateData,
      companyId,
      excelFilePath || undefined
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
        message: result.message || "Campaign not found",
      });
    }
  } catch (error: any) {
    console.log("error>>", error)
    loggerMsg("error", `Error in updateUserCampaignController: ${error.message}`);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};

/**
 * Get all user campaigns
 */
export const getAllUserCampaignsController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const eventId = req.query.eventId as string;
    const companyId = req.query.companyId as string;

    getAllUserCampaigns((error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Campaigns fetched successfully", result);
    }, page, limit, search, eventId, companyId);
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

/**
 * Get user campaign by ID
 */
export const getUserCampaignByIdController = async (req: Request, res: Response) => {
  try {
    getUserCampaignById(req.params.id, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Campaign fetched successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

/**
 * Delete user campaign by ID
 */
export const deleteUserCampaignByIdController = async (req: Request, res: Response) => {
  try {
    deleteUserCampaignById(req.params.id, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Campaign deleted successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

/**
 * Send campaign immediately
 */
export const sendCampaignNowController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    sendCampaignNow(id, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Campaign sending started", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};
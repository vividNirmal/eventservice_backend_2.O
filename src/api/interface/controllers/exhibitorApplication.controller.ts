import { Request, RequestHandler, Response } from "express";
import { loggerMsg } from "../../lib/logger";
import {
  successCreated,
  successResponse,
  ErrorResponse,
  errorResponseWithData,
} from "../../helper/apiResponse";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import EventHost from "../../domain/schema/eventHost.schema";
import { getAllExhibitorApplicationsAdminModel, getAllExhibitorApplicationsModel, resolveExhibitorApplicationModel, storeExhibitorApplicationModel, updateExhibitorApplicationStatusAdminModel } from "../../domain/models/exhibitorApplication.model";


// Resolve Email Controller
export const resolveExhibitorApplicationController = async (req: Request, res: Response) => {
  try {
    const { id: exhibitorFormId } = req.params;
    const eventUserId = req.user?.userId;

    if (!eventUserId) {
      return ErrorResponse(res, "User authentication required");
    }

    if (!exhibitorFormId) {
      return ErrorResponse(res, "Exhibitor form ID is required");
    }

    resolveExhibitorApplicationModel(
      new mongoose.Types.ObjectId(exhibitorFormId),
      new mongoose.Types.ObjectId(eventUserId),
      (error: any, result: any) => {
        if (error) {
          return errorResponseWithData(
            res,
            error.message,
            {},
            { errorType: error.errorType }
          );
        }

        return successResponse(res, "Application status checked successfully", result);
      }
    );
  } catch (error) {
    return ErrorResponse(res, "An error occurred while checking application status");
  }
};

/**
 * Controller for storing exhibitor application
 */
export const storeExhibitorApplicationController = async (req: Request, res: Response) => {
  try {
    const eventUserId = req.user?.userId;

    if (!eventUserId) {
      return ErrorResponse(res, "User authentication required");
    }

    storeExhibitorApplicationModel(
      req.body,
      req.files as Express.Multer.File[],
      eventUserId,
      (error, result) => {
        if (error) {
          return res.status(400).json({
            status: 0,
            message: error.message,
            errorType: error.errorType,
          });
        }
        
        return successResponse(
          res,
          "Exhibitor application submitted successfully",
          result
        );
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return ErrorResponse(res, "An error occurred during exhibitor application submission");
  }
};


export const getAllExhibitorApplicationsController = async (
  req: Request,
  res: Response
) => {
  try {
    const eventUserId = req.user?.userId;

    if (!eventUserId) {
      return ErrorResponse(res, "User authentication required");
    }

    const {
      page = 1,
      limit = 0,
      search,
    } = req.query;

    const filters = {
      ...(search && { search: search as string }),
    };

    const pagination = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };

    getAllExhibitorApplicationsModel(
      new mongoose.Types.ObjectId(eventUserId),
      filters,
      pagination,
      (error: any, result: any) => {
        if (error) {
          return errorResponseWithData(
            res,
            error.message,
            {},
            { errorType: error.errorType }
          );
        }

        return successResponse(
          res,
          "Exhibitor applications fetched successfully",
          result
        );
      }
    );
  } catch (error) {
    console.error("Error fetching exhibitor applications:", error);
    return ErrorResponse(res, "An error occurred while fetching applications");
  }
};

// Get all exhibitor applications for admin
export const getAllExhibitorApplicationsAdminController = async (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId as string;
    const eventId = req.query.eventId as string;

    if (!companyId) {
      return ErrorResponse(res, "Company ID is required");
    }

    const {
      page = 1,
      limit = 10,
      search,
    } = req.query;

    const filters = {
      ...(search && { search: search as string }),
      ...(eventId && { eventId: eventId as string }),
    };

    const pagination = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };

    getAllExhibitorApplicationsAdminModel(
      new mongoose.Types.ObjectId(companyId),
      filters,
      pagination,
      (error: any, result: any) => {
        if (error) {
          return errorResponseWithData(
            res,
            error.message,
            {},
            { errorType: error.errorType }
          );
        }

        return successResponse(
          res,
          "Exhibitor applications fetched successfully",
          result
        );
      }
    );
  } catch (error) {
    console.error("Error fetching exhibitor applications:", error);
    return ErrorResponse(res, "An error occurred while fetching applications");
  }
};

// Update exhibitor application status
export const updateExhibitorApplicationStatusAdminController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    if (!id) {
      return ErrorResponse(res, "Application ID is required");
    }

    if (typeof approved !== 'boolean') {
      return ErrorResponse(res, "Approved status is required and must be boolean");
    }

    updateExhibitorApplicationStatusAdminModel(
      new mongoose.Types.ObjectId(id),
      approved,
      (error: any, result: any) => {
        if (error) {
          return errorResponseWithData(
            res,
            error.message,
            {},
            { errorType: error.errorType }
          );
        }

        return successResponse(
          res,
          `Application ${approved ? 'approved' : 'disapproved'} successfully`,
          result
        );
      }
    );
  } catch (error) {
    console.error("Error updating application status:", error);
    return ErrorResponse(res, "An error occurred while updating application status");
  }
};
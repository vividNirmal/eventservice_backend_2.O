import { Request, Response } from 'express';
import {
  createEventImage,
  getAllEventImages,
  getEventImageById,
  deleteEventImageById,
  updateEventImage,
} from "../../domain/models/eventImages.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";
import mongoose from 'mongoose';

/**
 * Create new event image
 */
export const createEventImageController = async (req: Request, res: Response) => {
  try {
    const companyId = req.body.companyId;
    const eventId = req.body.eventId;
    const eventImageData = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Handle uploaded file
    if (files && Array.isArray(files)) {
      files.forEach((file) => {
        if (file.fieldname === "image") {
          eventImageData.image = `${file.uploadFolder}/${file.filename}`;
        }
      });
    }

    const result = await createEventImage(eventImageData, companyId, eventId);

    if (result.success) {
      return res.status(201).json({
        status: 1,
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(400).json({
        status: 0,
        message: result.message || "Failed to create event image",
      });
    }
  } catch (error: any) {
    loggerMsg("error", `Error in createEventImageController: ${error.message}`);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};

/**
 * Update event image
 */
export const updateEventImageController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.body.companyId;
    const updateData = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 0,
        message: "Invalid event image ID",
      });
    }

    // Remove system fields that shouldn’t be updated
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

    const result = await updateEventImage(
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
        message: result.message || "Event image not found",
      });
    }
  } catch (error: any) {
    loggerMsg("error", `Error in updateEventImageController: ${error.message}`);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
};

export const getAllEventImagesController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const eventId = req.query.eventId as string;

    getAllEventImages((error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Event images fetched successfully", result);
    }, page, limit, search, eventId);
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

export const getEventImageByIdController = async (req: Request, res: Response) => {
  try {
    getEventImageById(req.params.id, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Event image fetched successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};


export const deleteEventImageByIdController = async (req: Request, res: Response) => {
  try {
    deleteEventImageById(req.params.id, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Event image deleted successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

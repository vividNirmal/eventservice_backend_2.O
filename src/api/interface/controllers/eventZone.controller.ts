import { RequestHandler } from "express";
import {
  createEventZoneModule,
  getAllEventZones,
  getEventZoneById,
  updateEventZoneById,
  deleteEventZoneById,
} from "../../domain/models/eventZone.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";

// Create
export const createEventZoneController: RequestHandler = async (req, res) => {
  try {
    createEventZoneModule(req.body, (error, result) => {
      if (error) {
        loggerMsg("error", `Error in createEventZoneController: ${error.message}`);
        return ErrorResponse(res, error.message);
      }
      return successResponse(res, "EventZone created successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in createEventZoneController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

// Get all
export const getAllEventZonesController: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 0;
    const search = req.query.search as string;
    const eventId = req.query.eventId as string;
    const companyId = req.query.companyId as string;

    getAllEventZones((error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Fetched all EventZones", result);
    }, page, limit, search, eventId, companyId);
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

// Get by ID
export const getEventZoneByIdController: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    getEventZoneById(id, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Fetched EventZone by ID", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

// Update
export const updateEventZoneByIdController: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    updateEventZoneById(id, req.body, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "EventZone updated successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

// Delete
export const deleteEventZoneByIdController: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    deleteEventZoneById(id, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "EventZone deleted successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

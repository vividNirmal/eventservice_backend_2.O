import { RequestHandler } from "express";
import {
  createEBadgeSetting,
  getAllEBadgeSettings,
  getEBadgeSettingById,
  updateEBadgeSettingById,
  deleteEBadgeSettingById,
  updateEBadgeSettingPropertiesById,
} from "../../domain/models/eBadgeSetting.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";

export const createEBadgeSettingController: RequestHandler = async (req, res) => {
  try {
    createEBadgeSetting(req.body, (error, result) => {
      if (error) {
        loggerMsg("error", `Create eBadgeSetting error: ${error.message}`);
        return ErrorResponse(res, error.message);
      }
      return successResponse(res, "E-Badge setting created successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

export const getAllEBadgeSettingsController: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const eventId = req.query.eventId as string;

    getAllEBadgeSettings((error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "E-Badge settings fetched successfully", result);
    }, page, limit, search, eventId);
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

export const getEBadgeSettingByIdController: RequestHandler = async (req, res) => {
  try {
    getEBadgeSettingById(req.params.id, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "E-Badge setting fetched successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

export const updateEBadgeSettingByIdController: RequestHandler = async (req, res) => {
  try {
    updateEBadgeSettingById(req.params.id, req.body, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "E-Badge setting updated successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

export const deleteEBadgeSettingByIdController: RequestHandler = async (req, res) => {
  try {
    deleteEBadgeSettingById(req.params.id, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "E-Badge setting deleted successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

export const updateEBadgeSettingPropertiesByIdController: RequestHandler = async (req, res) => {
  try {
    updateEBadgeSettingPropertiesById(req.params.id, req.body, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "E-Badge setting updated successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};
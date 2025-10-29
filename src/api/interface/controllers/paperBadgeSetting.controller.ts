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
import { createPaperBadgeSetting, deletePaperBadgeSettingById, getAllPaperBadgeSettings, getPaperBadgeSettingById, updatePaperBadgeSettingById, updatePaperBadgeSettingPropertiesById } from "../../domain/models/paperBadgeSetting.model";

export const createPaperBadgeSettingController: RequestHandler = async (req, res) => {
  try {
    createPaperBadgeSetting(req.body, (error, result) => {
      if (error) {
        loggerMsg("error", `Create paperBadgeSetting error: ${error.message}`);
        return ErrorResponse(res, error.message);
      }
      return successResponse(res, "Paper Badge setting created successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

export const getAllPaperBadgeSettingsController: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const eventId = req.query.eventId as string;

    getAllPaperBadgeSettings((error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Paper Badge settings fetched successfully", result);
    }, page, limit, search, eventId);
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

export const getPaperBadgeSettingByIdController: RequestHandler = async (req, res) => {
  try {
    getPaperBadgeSettingById(req.params.id, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Paper Badge setting fetched successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

export const updatePaperBadgeSettingByIdController: RequestHandler = async (req, res) => {
  try {
    updatePaperBadgeSettingById(req.params.id, req.body, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Paper Badge setting updated successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

export const deletePaperBadgeSettingByIdController: RequestHandler = async (req, res) => {
  try {
    deletePaperBadgeSettingById(req.params.id, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Paper Badge setting deleted successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

export const updatePaperBadgeSettingPropertiesByIdController: RequestHandler = async (req, res) => {
  try {
    updatePaperBadgeSettingPropertiesById(req.params.id, req.body, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Paper Badge setting updated successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};
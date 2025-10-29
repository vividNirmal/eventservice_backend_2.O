import { RequestHandler } from "express";
import {
  createEBadgeTemplate,
  getAllEBadgeTemplates,
  getEBadgeTemplateById,
  updateEBadgeTemplateById,
  deleteEBadgeTemplateById,
  getEBadgeTemplateByEventId,
} from "../../domain/models/eBadgeTemplate.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";

export const createEBadgeTemplateController: RequestHandler = async (req, res) => {
  try {
    createEBadgeTemplate(req.body, (error, result) => {
      if (error) {
        loggerMsg("error", `Create template error: ${error.message}`);
        return ErrorResponse(res, error.message);
      }
      return successResponse(res, "Template created successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Create template controller error: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

export const getAllEBadgeTemplatesController: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    getAllEBadgeTemplates((error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Templates fetched successfully", result);
    }, page, limit, search);
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

export const getEBadgeTemplateByIdController: RequestHandler = async (req, res) => {
  try {
    getEBadgeTemplateById(req.params.id, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Template fetched successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

export const getEBadgeTemplateByEventIdController: RequestHandler = async (req, res) => {
  try {
    getEBadgeTemplateByEventId(req.params.eventid, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Template fetched successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

export const updateEBadgeTemplateByIdController: RequestHandler = async (req, res) => {
  try {
    updateEBadgeTemplateById(req.params.id, req.body, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Template updated successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

export const deleteEBadgeTemplateByIdController: RequestHandler = async (req, res) => {
  try {
    deleteEBadgeTemplateById(req.params.id, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Template deleted successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

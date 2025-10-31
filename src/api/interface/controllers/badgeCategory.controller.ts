import { RequestHandler } from "express";
import {
  createBadgeCategory,
  getAllBadgeCategories,
  getBadgeCategoryById,
  getBadgeCategoryByEventId,
  updateBadgeCategoryById,
  deleteBadgeCategoryById,
} from "../../domain/models/badgeCategory.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";

export const createBadgeCategoryController: RequestHandler = async (req, res) => {
  try {
    createBadgeCategory(req.body, (error, result) => {
      if (error) {
        loggerMsg("error", `Create category error: ${error.message}`);
        return ErrorResponse(res, error.message);
      }
      return successResponse(res, "Category created successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Create category controller error: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

export const getAllBadgeCategoriesController: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const eventId = req.query.eventId as string

    getAllBadgeCategories((error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Categories fetched successfully", result);
    }, page, limit, search,eventId);
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

export const getBadgeCategoryByIdController: RequestHandler = async (req, res) => {
  try {
    getBadgeCategoryById(req.params.id, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Category fetched successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

export const getBadgeCategoryByEventIdController: RequestHandler = async (req, res) => {
  try {
    getBadgeCategoryByEventId(req.params.eventid, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Categories fetched successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

export const updateBadgeCategoryByIdController: RequestHandler = async (req, res) => {
  try {
    updateBadgeCategoryById(req.params.id, req.body, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Category updated successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

export const deleteBadgeCategoryByIdController: RequestHandler = async (req, res) => {
  try {
    deleteBadgeCategoryById(req.params.id, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Category deleted successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

import { Request, Response, NextFunction, RequestHandler } from "express";
import {
  createEventCategoryModule,
  getAllEventCategories,
  getEventCategoryById,
  updateEventCategoryById,
  deleteEventCategoryById,
  getEventByCategory,
} from "../../domain/models/eventCategory.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";

export const createEventCategoryController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const data = req.body;
    const token = req.headers.authorization;
    createEventCategoryModule(data,token, (error, result) => {
      if (error) {
        loggerMsg(
          "error",
          `Error in createEventCategoryController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Event category created successfully");
      return successResponse(res, "Event category created successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in createEventCategoryController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

export const getAllEventCategoriesController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const search = req.query.search as string;
    const companyId  = req.query.companyId as string;
    getAllEventCategories(
      companyId,
      (error, result) => {
        if (error) {
          loggerMsg(
            "error",
            `Error in getAllEventCategoriesController: ${error.message}`
          );
          return ErrorResponse(res, error.message);
        }

        loggerMsg("info", "Event categories fetched successfully");
        return successResponse(
          res,
          "Event categories fetched successfully",
          result
        );
      },
      page,
      limit,
      search
    );
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in getAllEventCategoriesController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

export const getEventCategoryByIdController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization;
    getEventCategoryById(id, token,(error, result) => {
      if (error) {
        loggerMsg(
          "error",
          `Error in getEventCategoryByIdController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Event category fetched successfully");
      return successResponse(
        res,
        "Event category fetched successfully",
        result
      );
    });
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in getEventCategoryByIdController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

export const updateEventCategoryByIdController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const token = req.headers.authorization;
    updateEventCategoryById(id, data,token, (error, result) => {
      if (error) {
        loggerMsg(
          "error",
          `Error in updateEventCategoryByIdController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Event category updated successfully");
      return successResponse(
        res,
        "Event category updated successfully",
        result
      );
    });
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in updateEventCategoryByIdController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

export const deleteEventCategoryByIdController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization;
    deleteEventCategoryById(id,token, (error, result) => {
      if (error) {
        loggerMsg(
          "error",
          `Error in deleteEventCategoryByIdController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Event category deleted successfully");
      return successResponse(
        res,
        "Event category deleted successfully",
        result
      );
    });
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in deleteEventCategoryByIdController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

export const eventByCategoryController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    getEventByCategory(id, (error, result) => {
      if (error) {
        loggerMsg(
          "error",    
          `Error in eventByCategoryController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }
      loggerMsg("info", "Events fetched successfully by category");
      return successResponse(
        res,
        "Events fetched successfully by category",
        result
      );
    });
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in eventByCategoryController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};
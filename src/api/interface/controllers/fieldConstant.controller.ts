import { Request, Response, NextFunction, RequestHandler } from "express";
import {
  createFieldConstant,
  getAllFieldConstants,
  getFieldConstantById,
  updateFieldConstantById,
  deleteFieldConstantById,
} from "../../domain/models/fieldConstant.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";

export const createFieldConstantController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const data = req.body;

    createFieldConstant(data, (error: any, result: any) => {
      if (error) {
        loggerMsg(
          "error",
          `Error in createFieldConstantController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Field constant created successfully");
      return successResponse(res, "Field constant created successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in createFieldConstantController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

export const getAllFieldConstantsController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    getAllFieldConstants(
      (error: any, result: any) => {
        if (error) {
          loggerMsg(
            "error",
            `Error in getAllFieldConstantsController: ${error.message}`
          );
          return ErrorResponse(res, error.message);
        }

        loggerMsg("info", "Fetched all field constants successfully");
        return successResponse(
          res,
          "Fetched all field constants successfully",
          result
        );
      },
      page,
      limit,
      search
    );
  } catch (error: any) {
    loggerMsg("error", `Error in getAllFieldConstantsController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

export const getFieldConstantByIdController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    getFieldConstantById(id, (error: any, result: any) => {
      if (error) {
        loggerMsg(
          "error",
          `Error in getFieldConstantByIdController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Fetched field constant by ID successfully");
      return successResponse(
        res,
        "Fetched field constant by ID successfully",
        result
      );
    });
  } catch (error: any) {
    loggerMsg("error", `Error in getFieldConstantByIdController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

export const updateFieldConstantByIdController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    updateFieldConstantById(id, updateData, (error: any, result: any) => {
      if (error) {
        loggerMsg(
          "error",
          `Error in updateFieldConstantByIdController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Field constant updated successfully");
      return successResponse(res, "Field constant updated successfully", result);
    });
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in updateFieldConstantByIdController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

export const deleteFieldConstantByIdController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    deleteFieldConstantById(id, (error: any, result: any) => {
      if (error) {
        loggerMsg(
          "error",
          `Error in deleteFieldConstantByIdController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Field constant deleted successfully");
      return successResponse(res, "Field constant deleted successfully", result);
    });
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in deleteFieldConstantByIdController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

import { Request, Response, NextFunction, RequestHandler } from "express";
import {
  createUserTypeModule,
  getAllUserTypes,
  getUserTypeById,
  updateUserTypeById,
  deleteUserTypeById,
} from "../../domain/models/userType.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";

export const createUserTypeController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const data = req.body;

    createUserTypeModule(data, (error, result) => {
      if (error) {
        loggerMsg(
          "error",
          `Error in createUserTypeController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "User type created successfully");
      return successResponse(res, "User type created successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in createUserTypeController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

export const getAllUserTypesController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    // const companyId = req.query.companyId as string;

    getAllUserTypes(
      (error, result) => {
        if (error) {
          loggerMsg(
            "error",
            `Error in getAllUserTypesController: ${error.message}`
          );
          return ErrorResponse(res, error.message);
        }

        loggerMsg("info", "Fetched all user types successfully");
        return successResponse(
          res,
          "Fetched all user types successfully",
          result
        );
      },
      page,
      limit,
      search,
      // companyId
    );
  } catch (error: any) {
    loggerMsg("error", `Error in getAllUserTypesController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

export const getUserTypeByIdController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    getUserTypeById(id, (error, result) => {
      if (error) {
        loggerMsg(
          "error",
          `Error in getUserTypeByIdController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Fetched user type by ID successfully");
      return successResponse(
        res,
        "Fetched user type by ID successfully",
        result
      );
    });
  } catch (error: any) {
    loggerMsg("error", `Error in getUserTypeByIdController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

export const updateUserTypeByIdController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    updateUserTypeById(id, updateData, (error, result) => {
      if (error) {
        loggerMsg(
          "error",
          `Error in updateUserTypeByIdController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "User type updated successfully");
      return successResponse(res, "User type updated successfully", result);
    });
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in updateUserTypeByIdController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

export const deleteUserTypeByIdController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    deleteUserTypeById(id, (error, result) => {
      if (error) {
        loggerMsg(
          "error",
          `Error in deleteUserTypeByIdController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "User type deleted successfully");
      return successResponse(res, "User type deleted successfully", result);
    });
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in deleteUserTypeByIdController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

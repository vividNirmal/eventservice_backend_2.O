import { RequestHandler } from "express";
import { 
  createUserTypeMapModule,
  getAllUserTypeMaps,
  getUserTypeMapById,
  updateUserTypeMapById,
  deleteUserTypeMapById
} from "../../domain/models/userTypeMap.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";

// Create
export const createUserTypeMapController: RequestHandler = async (req, res) => {
  try {
    createUserTypeMapModule(req.body, (error, result) => {
      if (error) {
        loggerMsg("error", `Error in createUserTypeMapController: ${error.message}`);
        return ErrorResponse(res, error.message);
      }
      return successResponse(res, "UserTypeMap created successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in createUserTypeMapController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

// Get all
export const getAllUserTypeMapsController: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const companyId = req.query.companyId as string;

    getAllUserTypeMaps((error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Fetched all UserTypeMaps", result);
    }, page, limit, search, companyId);
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

// Get by ID
export const getUserTypeMapByIdController: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    getUserTypeMapById(id, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Fetched UserTypeMap by ID", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

// Update
export const updateUserTypeMapByIdController: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    updateUserTypeMapById(id, req.body, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "UserTypeMap updated successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

// Delete
export const deleteUserTypeMapByIdController: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    deleteUserTypeMapById(id, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "UserTypeMap deleted successfully", result);
    });
  } catch (error: any) {
    return ErrorResponse(res, error.message);
  }
};

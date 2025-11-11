import { RequestHandler } from "express";
import {
  createExhibitorFormConfiguration,
  getAllExhibitorFormConfigurations,
  getExhibitorFormConfigurationById,
  updateExhibitorFormConfigurationById,
  deleteExhibitorFormConfigurationById,
} from "../../domain/models/exhibitorFormConfiguration.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";

export const createExhibitorFormConfigurationController: RequestHandler = async (
  req,
  res
) => {
  try {
    const data = req.body;

    createExhibitorFormConfiguration(data, (error, result) => {
      if (error) {
        loggerMsg("error", `Error in createExhibitorFormConfigurationController: ${error.message}`);
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Exhibitor form configuration created successfully");
      return successResponse(res, "Configuration created successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in createExhibitorFormConfigurationController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

export const getAllExhibitorFormConfigurationsController: RequestHandler = async (
  req,
  res
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 0;
    const search = req.query.search as string;

    getAllExhibitorFormConfigurations(
      (error, result) => {
        if (error) {
          loggerMsg("error", `Error in getAllExhibitorFormConfigurationsController: ${error.message}`);
          return ErrorResponse(res, error.message);
        }

        loggerMsg("info", "Fetched all exhibitor form configurations successfully");
        return successResponse(res, "Fetched all configurations successfully", result);
      },
      page,
      limit,
      search
    );
  } catch (error: any) {
    loggerMsg("error", `Error in getAllExhibitorFormConfigurationsController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

export const getExhibitorFormConfigurationByIdController: RequestHandler = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    getExhibitorFormConfigurationById(id, (error, result) => {
      if (error) {
        loggerMsg("error", `Error in getExhibitorFormConfigurationByIdController: ${error.message}`);
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Fetched exhibitor form configuration by ID successfully");
      return successResponse(res, "Fetched configuration successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in getExhibitorFormConfigurationByIdController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

export const updateExhibitorFormConfigurationByIdController: RequestHandler = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    updateExhibitorFormConfigurationById(id, updateData, (error, result) => {
      if (error) {
        loggerMsg("error", `Error in updateExhibitorFormConfigurationByIdController: ${error.message}`);
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Exhibitor form configuration updated successfully");
      return successResponse(res, "Configuration updated successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in updateExhibitorFormConfigurationByIdController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

export const deleteExhibitorFormConfigurationByIdController: RequestHandler = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    deleteExhibitorFormConfigurationById(id, (error, result) => {
      if (error) {
        loggerMsg("error", `Error in deleteExhibitorFormConfigurationByIdController: ${error.message}`);
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Exhibitor form configuration deleted successfully");
      return successResponse(res, "Configuration deleted successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in deleteExhibitorFormConfigurationByIdController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

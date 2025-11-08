import { Request, Response, NextFunction, RequestHandler } from "express";
import {
  createEventPackageModule,
  getAllEventPackages,
  getEventPackageById,
  updateEventPackageModule,
  deleteEventPackagesModule,
  eventandCategoryAttendesModule,
} from "../../domain/models/eventPackage.model";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";

export const createEventPackageController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const data = req.body;
    const token = req.headers.authorization;

    // Validate required fields
    if (!data.title) {
      return ErrorResponse(res, "Package title is required");
    }

    if (!data.event_package || data.event_package.length === 0) {
      return ErrorResponse(
        res,
        "At least one event must be included in the package"
      );
    }

    createEventPackageModule(data, token, (error, result) => {
      if (error) {
        loggerMsg(
          "error",
          `Error in createEventPackageController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Event package created successfully");
      return successResponse(res, "Event package created successfully", result);
    });
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in createEventPackageController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

export const getAllEventPackagesController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const token = req.headers.authorization;

    getAllEventPackages(
      (error, result) => {
        if (error) {
          loggerMsg(
            "error",
            `Error in getAllEventPackagesController: ${error.message}`
          );
          return ErrorResponse(res, error.message);
        }

        loggerMsg("info", "Event packages fetched successfully");
        return successResponse(
          res,
          "Event packages fetched successfully",
          result
        );
      },
      page,
      limit,
      search,
      token
    );
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in getAllEventPackagesController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

export const getEventPackageByIdController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization;

    if (!id) {
      return ErrorResponse(res, "Package ID is required");
    }

    getEventPackageById(id, token, (error, result) => {
      if (error) {
        loggerMsg(
          "error",
          `Error in getEventPackageByIdController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Event package fetched successfully");
      return successResponse(res, "Event package fetched successfully", result);
    });
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in getEventPackageByIdController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

export const updateEventPackageController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const token = req.headers.authorization;

    if (!id) {
      return ErrorResponse(res, "Package ID is required");
    }

    updateEventPackageModule(id, data, token, (error, result) => {
      if (error) {
        loggerMsg(
          "error",
          `Error in updateEventPackageController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Event package updated successfully");
      return successResponse(res, "Event package updated successfully", result);
    });
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in updateEventPackageController: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

export const deleteEventPackagesController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { package_ids } = req.body;
    const token = req.headers.authorization;

    deleteEventPackagesModule(package_ids, token, (error, result) => {
      if (error) {
        loggerMsg(
          "error",
          `Error in deleteEventPackagesController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }

      loggerMsg(
        "info",
        `Successfully deleted ${result.deletedCount} event package(s)`
      );
      return successResponse(
        res,
        `Successfully deleted ${result.deletedCount} event package(s).`,
        result.deletedCount
      );
    });
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in deleteEventPackagesController: ${error.message}`
    );
    return ErrorResponse(res, "An error occurred during package deletion.");
  }
};

export const eventandCategoryAttendes: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const token = req.headers.authorization;
    eventandCategoryAttendesModule(token, (error, result) => {
      if (error) {
        loggerMsg(
          "error",
          `Error in deleteEventPackagesController: ${error.message}`
        );
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", `Successfully Event Data get `);
      return successResponse(
        res,
        `Successfully Event Data get  event package(s).`,
        result
      );
    });
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in deleteEventPackagesController: ${error.message}`
    );
    return ErrorResponse(res, "An error occurred during package deletion.");
  }
};

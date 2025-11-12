import { RequestHandler } from "express";
import { loggerMsg } from "../../lib/logger";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";

import { createPaymentHistoryModule, getAllPaymentHistoryModule,
  getPaymentHistoryByIdModule,
  deletePaymentHistoryModule,
  updatePaymentHistoryModule, } from "../../domain/models/exhibitorPament.model";

// Create Payment History
export const createPaymentHistory: RequestHandler = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const { total_payable, type, slot, itemId } = req.body;

    // Validation
    if (!token) {
      loggerMsg("error", "Authorization token is missing");
      return ErrorResponse(res, "Authorization token is required");
    }

    // Updated validation - accepts 0 or positive values
    if (total_payable === undefined || total_payable === null) {
      loggerMsg("error", "Total payable amount is missing");
      return ErrorResponse(res, "Total payable amount is required");
    }

    if (total_payable < 0) {
      loggerMsg("error", "Invalid total payable amount");
      return ErrorResponse(res, "Total payable amount cannot be negative");
    }

    if (!type || !["package", "ticket"].includes(type)) {
      loggerMsg("error", "Invalid type provided");
      return ErrorResponse(res, "Type must be either 'package' or 'ticket'");
    }

    if (!itemId) {
      loggerMsg("error", `${type} ID is missing`);
      return ErrorResponse(
        res,
        `${type === "package" ? "Package" : "Ticket"} ID is required`
      );
    }

    // Validate slot (number of tickets)
    if (slot !== undefined && slot !== null && (isNaN(slot) || slot <= 0)) {
      loggerMsg("error", "Invalid slot number");
      return ErrorResponse(res, "Slot must be a positive number");
    }

    createPaymentHistoryModule(
      { total_payable, type, slot, itemId },
      token,
      (error: any, result: any) => {
        if (error) {
          loggerMsg("error", `Error in createPaymentHistory: ${error.message}`);
          return ErrorResponse(res, error.message);
        }

        loggerMsg("info", "Payment history created successfully");
        return successResponse(
          res,
          "Payment history created successfully",
          result
        );
      }
    );
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in createPaymentHistory controller: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

// Get All Payment History
export const getAllPaymentHistory: RequestHandler = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const pay_status = req.query.pay_status as string;
    const pay_mode = req.query.pay_mode as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    if (!token) {
      loggerMsg("error", "Authorization token is missing");
      return ErrorResponse(res, "Authorization token is required");
    }

    getAllPaymentHistoryModule(
      {
        page,
        limit,
        search,
        pay_status,
        pay_mode,
        startDate,
        endDate,
      },
      token,
      (error: any, result: any) => {
        if (error) {
          loggerMsg(
            "error",
            `Error in getAllPaymentHistory: ${error.message}`
          );
          return ErrorResponse(res, error.message);
        }

        loggerMsg("info", "Payment history fetched successfully");
        return successResponse(
          res,
          "Payment history fetched successfully",
          result
        );
      }
    );
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in getAllPaymentHistory controller: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

// Get Payment History By ID
export const getPaymentHistoryById: RequestHandler = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const { id } = req.params;

    if (!token) {
      loggerMsg("error", "Authorization token is missing");
      return ErrorResponse(res, "Authorization token is required");
    }

    if (!id) {
      loggerMsg("error", "Payment history ID is missing");
      return ErrorResponse(res, "Payment history ID is required");
    }

    getPaymentHistoryByIdModule(
      id,
      token,
      (error: any, result: any) => {
        if (error) {
          loggerMsg(
            "error",
            `Error in getPaymentHistoryById: ${error.message}`
          );
          return ErrorResponse(res, error.message);
        }

        loggerMsg("info", "Payment history details fetched successfully");
        return successResponse(
          res,
          "Payment history details fetched successfully",
          result
        );
      }
    );
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in getPaymentHistoryById controller: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

// Update Payment History
export const updatePaymentHistory: RequestHandler = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const { id } = req.params;
    const updateData = req.body;

    if (!token) {
      loggerMsg("error", "Authorization token is missing");
      return ErrorResponse(res, "Authorization token is required");
    }

    if (!id) {
      loggerMsg("error", "Payment history ID is missing");
      return ErrorResponse(res, "Payment history ID is required");
    }

    updatePaymentHistoryModule(
      id,
      updateData,
      token,
      (error: any, result: any) => {
        if (error) {
          loggerMsg(
            "error",
            `Error in updatePaymentHistory: ${error.message}`
          );
          return ErrorResponse(res, error.message);
        }

        loggerMsg("info", "Payment history updated successfully");
        return successResponse(
          res,
          "Payment history updated successfully",
          result
        );
      }
    );
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in updatePaymentHistory controller: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};

// Delete Payment History
export const deletePaymentHistory: RequestHandler = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const { id } = req.params;

    if (!token) {
      loggerMsg("error", "Authorization token is missing");
      return ErrorResponse(res, "Authorization token is required");
    }

    if (!id) {
      loggerMsg("error", "Payment history ID is missing");
      return ErrorResponse(res, "Payment history ID is required");
    }

    deletePaymentHistoryModule(
      id,
      token,
      (error: any, result: any) => {
        if (error) {
          loggerMsg(
            "error",
            `Error in deletePaymentHistory: ${error.message}`
          );
          return ErrorResponse(res, error.message);
        }

        loggerMsg("info", "Payment history deleted successfully");
        return successResponse(
          res,
          "Payment history deleted successfully",
          result
        );
      }
    );
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in deletePaymentHistory controller: ${error.message}`
    );
    return ErrorResponse(res, error.message);
  }
};
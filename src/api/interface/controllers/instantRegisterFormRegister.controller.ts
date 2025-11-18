import { RequestHandler } from "express";
import { loggerMsg } from "../../lib/logger";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { instantRegisteredFormRegistrationModel } from "../../domain/models/instantRegistered.model";


export const instantRegisteredFormRegistration: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const data = req.body;

    instantRegisteredFormRegistrationModel(data,  (error, result) => {
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
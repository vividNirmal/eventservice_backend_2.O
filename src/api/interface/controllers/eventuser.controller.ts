import { RequestHandler } from "express";
import { loggerMsg } from "../../lib/logger";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { eventuserEvent } from "../../domain/models/eventuser.modle";

export const EventuserEvents: RequestHandler = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    eventuserEvent(
      (error: any, result: any) => {
        if (error) {
          loggerMsg(
            "error",
            `Error in getAllFieldConstantsController: ${error.message}`
          );
          return ErrorResponse(res, error.message);
        }

        loggerMsg("info", "Fetched Events successfully");
        return successResponse(res, "Fetched all Events successfully", result);
      },
      page,
      limit,
      search,
      token
    );
  } catch (error: any) {
    loggerMsg("error", `Error in EventuserEvents: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

export const storeEventUserCompanyTeam : RequestHandler = async (req, res, next) => {
  try {
    
    eventuserEvent(
      (error: any, result: any) => {
        if (error) {
          loggerMsg(
            "error",
            `Error in getAllFieldConstantsController: ${error.message}`
          );
          return ErrorResponse(res, error.message);
        }

        loggerMsg("info", "Fetched Events successfully");
        return successResponse(res, "Fetched all Events successfully", result);
      },
      req.body
    );
  } catch (error: any) {
    loggerMsg("error", `Error in StoreEventuserCopanyteams: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

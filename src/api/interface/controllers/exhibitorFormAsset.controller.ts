// controllers/exhibitorFormAsset.controller.ts
import { RequestHandler } from "express";
import { ErrorResponse, successResponse } from "../../helper/apiResponse";
import { loggerMsg } from "../../lib/logger";
import {
  getExhibitorFormAssetList,
  upsertExhibitorFormAsset,
  getExhibitorFormAssetByConfig,
} from "../../domain/models/exhibitorFormAsset.model";

export const getExhibitorFormAssetListController: RequestHandler = async (
  req,
  res
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const eventId = req.query.eventId as string;

    if (!eventId) {
      return ErrorResponse(res, "Event ID is required");
    }

    getExhibitorFormAssetList(
      (error, result) => {
        if (error) {
          loggerMsg("error", `Error in getExhibitorFormAssetListController: ${error.message}`);
          return ErrorResponse(res, error.message);
        }

        loggerMsg("info", "Fetched exhibitor asset list successfully");
        return successResponse(res, "Fetched assets successfully", result);
      },
      eventId,
      page,
      limit,
      search,
    );
  } catch (error: any) {
    loggerMsg("error", `Error in getExhibitorFormAssetListController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

export const upsertExhibitorFormAssetController: RequestHandler = async (
  req,
  res
) => {
  try {
    const data = req.body;

    upsertExhibitorFormAsset(data, (error, result) => {
      if (error) {
        loggerMsg("error", `Error in upsertExhibitorFormAssetController: ${error.message}`);
        return ErrorResponse(res, error.message);
      }

      const action = result.asset._id ? "updated" : "created";
      loggerMsg("info", `Exhibitor asset ${action} successfully`);
      return successResponse(res, `Asset ${action} successfully`, result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in upsertExhibitorFormAssetController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};

export const getExhibitorFormAssetByConfigController: RequestHandler = async (
  req,
  res
) => {
  try {
    const { eventId, formConfigId } = req.params;

    getExhibitorFormAssetByConfig(eventId, formConfigId, (error, result) => {
      if (error) {
        loggerMsg("error", `Error in getExhibitorFormAssetByFormConfigController: ${error.message}`);
        return ErrorResponse(res, error.message);
      }

      loggerMsg("info", "Fetched exhibitor asset by form config successfully");
      return successResponse(res, "Fetched asset successfully", result);
    });
  } catch (error: any) {
    loggerMsg("error", `Error in getExhibitorFormAssetByFormConfigController: ${error.message}`);
    return ErrorResponse(res, error.message);
  }
};
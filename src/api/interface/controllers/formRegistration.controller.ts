import { Request, Response } from "express";
import { loggerMsg } from "../../lib/logger";
import {
  successCreated,
  successResponse,
  ErrorResponse,
  errorResponseWithData,
} from "../../helper/apiResponse";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import path from "path";
import fs from "fs";
import { env } from "process";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  getFormRegistrationModel,
  resolveEmailModel,
  resolveFormUrlModel,
  storeFormRegistrationModel,
} from "../../domain/models/formRegistration.model";
import mongoose from "mongoose";
import FormRegistration from "../../domain/schema/formRegistration.schema";
import Ticket from "../../domain/schema/ticket.schema";
import EventHost from "../../domain/schema/eventHost.schema";

// Resolve Ticket URL Controller
export const resolveFormUrlController = async (req: Request, res: Response) => {
  try {
    const { eventSlug, userTypeSlug } = req.body;

    if (!eventSlug || !userTypeSlug) {
      return ErrorResponse(res, "Please provide valid parameters.", {
        errorType: "REQUIRE_PARAMETER",
      });
    }

    resolveFormUrlModel(eventSlug, userTypeSlug, (error: any, result: any) => {
      if (error) {
        return errorResponseWithData(
          res,
          error.message,
          {},
          { errorType: error.errorType }
        );
      }

      return successResponse(res, "Form retrieved successfully", result);
    });
  } catch (error) {
    return ErrorResponse(res, "An error occurred while fetching form.", {
      errorType: "INTERNAL_SERVER_ERROR",
    });
  }
};

// Resolve Email Controller
export const resolveEmailController = async (req: Request, res: Response) => {
  try {
    const { email, ticketId } = req.body;

    if (!email || !ticketId) {
      return ErrorResponse(res, "Please provide valid email and ticketId.", {
        errorType: "REQUIRE_PARAMETER",
      });
    }

    resolveEmailModel(
      email,
      new mongoose.Types.ObjectId(ticketId),
      (error: any, result: any) => {
        if (error) {
          return errorResponseWithData(
            res,
            error.message,
            {},
            { errorType: error.errorType }
          );
        }

        return successResponse(res, "Form retrieved successfully", result);
      }
    );
  } catch (error) {
    return ErrorResponse(res, "An error occurred while fetching form.", {
      errorType: "INTERNAL_SERVER_ERROR",
    });
  }
};

export const submitRegistrationController = async (
  req: Request,
  res: Response
) => {
  try {
    console.log('🚀 Submit Registration - Request Body:', req.body);
    console.log('🚀 Submit Registration - Files:', req.files);
    console.log('🚀 Submit Registration - Content Type:', req.headers['content-type']);

    storeFormRegistrationModel(
      req.body,
      req.files as Express.Multer.File[],
      (error, result) => {
        if (error) {
          return errorResponseWithData(
            res,
            error.message,
            {},
            { errorType: error.errorType }
          );
        }
        return successResponse(
          res,
          "Registration completed successfully",
          result
        );
      }
    );
  } catch (error) {
    return ErrorResponse(res, "An error occurred during registration.", {
      errorType: "INTERNAL_SERVER_ERROR",
    });
  }
};

export const getRegistrationController = async (
  req: Request,
  res: Response
) => {
  try {
    const { registrationId } = req.params;
    getFormRegistrationModel(registrationId, (error, result) => {
      if (error) {
        return errorResponseWithData(
          res,
          error.message,
          {},
          { errorType: error.errorType }
        );
      }
      return successResponse(
        res,
        "Registration retrieved successfully",
        result
      );
    });
  } catch (error) {
    return ErrorResponse(
      res,
      "An error occurred while fetching registration.",
      { errorType: "INTERNAL_SERVER_ERROR" }
    );
  }
};

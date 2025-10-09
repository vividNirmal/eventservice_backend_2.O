import { Request, Response } from "express";
import { loggerMsg } from "../../lib/logger";
import { successCreated, successResponse ,ErrorResponse, errorResponseWithData } from "../../helper/apiResponse";
import { storeEvent,updateEvent,getEventTokenDetails ,adminEventList,getEventParticipantUserListModal,getAllEventParticipantUserListModal,getPeopleListOptimized,updateEventExtraDetails} from "../../domain/models/event.model";
import {v4 as uuidv4} from "uuid"
import multer from "multer"
import path from "path"
import fs from "fs";
import eventSchema from "../../domain/schema/event.schema";
import eventParticipantSchema from "../../domain/schema/eventParticipant";
import deviceUrlMappingSchema from "../../domain/schema/deviceUrlMapping.schema";
import formUrlMappingSchema from "../../domain/schema/formUrlMapping.schema";
import reasonSchema from "../../domain/schema/RFV.schema";
import companyActivitySchema from "../../domain/schema/companyActivity.schema";
import Companyactivity from "../../domain/schema/event.schema";
import { cryptoService } from "../../services/cryptoService";
import { env } from "process";
import participantUsersSchema from "../../domain/schema/participantUsers.schema";
import scannerMachineSchema from "../../domain/schema/scannerMachine.schema";
import jwt from "jsonwebtoken";
import scannerTokenSchema from "../../domain/schema/scannerToken.schema";
import eventHostSchema from "../../domain/schema/eventHost.schema";
import crypto from "crypto";
import ticketSchema from "../../domain/schema/ticket.schema";
import { resolveEmailModel, resolveFormUrlModel } from "../../domain/models/formRegistration.model";
import mongoose from "mongoose";

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
        return errorResponseWithData(res, error.message, {}, { errorType: error.errorType });
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

    resolveEmailModel(email, new mongoose.Types.ObjectId(ticketId), (error: any, result: any) => {
      if (error) {
        return errorResponseWithData(res, error.message, {}, { errorType: error.errorType });
      }

      return successResponse(res, "Form retrieved successfully", result);
    });
  } catch (error) {
    return ErrorResponse(res, "An error occurred while fetching form.", {
      errorType: "INTERNAL_SERVER_ERROR",
    });
  }
};

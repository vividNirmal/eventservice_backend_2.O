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
import { resolveFormUrlModel } from "../../domain/models/formRegistration.model";


export const resolveFormUrlController = async (req: Request, res: Response) => {
  try {
    const { eventSlug, userTypeSlug } = req.body;

    console.log("Received eventSlug:", eventSlug);
    console.log("Received userTypeSlug:", userTypeSlug);
    console.log("Request Body:", req.body);

    if (!eventSlug || !userTypeSlug) {
      return ErrorResponse(res, "Please provide valid eventSlug and userTypeSlug.");
    }

    resolveFormUrlModel(eventSlug, userTypeSlug, (error: any, result: any) => {
      if (error) {
        return res.status(500).json({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "An unexpected error occurred.",
        });
      }

      return successResponse(res, "Form retrieved successfully", result);
    });
  } catch (error) {
    return ErrorResponse(res, "An error occurred while fetching form.");
  }
};

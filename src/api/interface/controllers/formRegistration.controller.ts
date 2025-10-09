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
  resolveEmailModel,
  resolveFormUrlModel,
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
    const { regEmail, ticketId } = req.body;

    if (!regEmail || !ticketId) {
      return ErrorResponse(res, "Please provide valid email and ticketId.", {
        errorType: "REQUIRE_PARAMETER",
      });
    }

    resolveEmailModel(
      regEmail,
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
    const { ticketId, eventId, regEmail, ...dynamicFormData } = req.body;

    // Validate required fields
    if (!ticketId || !regEmail) {
      return ErrorResponse(res, "Ticket ID and email are required.", {
        errorType: "REQUIRE_PARAMETER",
      });
    }

    // Check if ticket exists and is active
    const ticket = await Ticket.findById(ticketId);
    if (!ticket || ticket.status !== "active") {
      return ErrorResponse(res, "Invalid or inactive ticket.", {
        errorType: "INVALID_TICKET",
      });
    }

    // Check registration limits using existing model
    const emailCheck = await new Promise((resolve, reject) => {
      resolveEmailModel(
        regEmail,
        new mongoose.Types.ObjectId(ticketId),
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    if ((emailCheck as any).errorType === "LIMIT_REACHED") {
      return ErrorResponse(res, (emailCheck as any).message, {
        errorType: "LIMIT_REACHED",
      });
    }

    const files = req.files as Express.Multer.File[];
    const processedFormData = { ...dynamicFormData };

    // Group files by fieldname
    const filesByField: { [key: string]: Express.Multer.File[] } = {};
    files.forEach((file) => {
      if (!filesByField[file.fieldname]) {
        filesByField[file.fieldname] = [];
      }
      filesByField[file.fieldname].push(file);
    });

    // Process each field separately
    Object.keys(filesByField).forEach((fieldName) => {
      const fileArray = filesByField[fieldName];

      if (fileArray.length === 1) {
        // Single file → store as string path
        processedFormData[fieldName] = `${(fileArray[0] as any).uploadFolder}/${
          fileArray[0].filename
        }`;
      } else {
        // Multiple files → store as array of paths
        processedFormData[fieldName] = fileArray.map(
          (file) => `${(file as any).uploadFolder}/${file.filename}`
        );
      }
    });

    // // Optional: create a consolidated attachments array
    // const allAttachments: string[] = files.map(file => `${(file as any).uploadFolder}/${file.filename}`);
    // if (allAttachments.length > 0) {
    //   processedFormData.attachments = allAttachments;
    // }

    // Determine approval status based on ticket's advanced settings
    const isAutoApproved = ticket.advancedSettings?.autoApprovedUser || false;

    // Generate badge number if not provided (you can implement your own logic)
    const finalBadgeNo = await generateBadgeNumber(ticket);

    // Create registration record
    const formRegistration = new FormRegistration({
      regEmail: regEmail.toLowerCase(),
      ticketId: new mongoose.Types.ObjectId(ticketId),
      eventId: eventId ? new mongoose.Types.ObjectId(eventId) : ticket.eventId,
      badgeNo: finalBadgeNo,
      formData: processedFormData,
      approved: isAutoApproved
    });

    await formRegistration.save();

    // Return success response
    return successResponse(res, "Registration completed successfully", {
      registrationId: formRegistration._id,
      badgeNo: finalBadgeNo,
      email: regEmail,
    });
  } catch (error: any) {
    loggerMsg("Error in submitRegistrationController:", error);

    return ErrorResponse(res, "An error occurred during registration.", {
      errorType: "INTERNAL_SERVER_ERROR",
    });
  }
};

const generateBadgeNumber = async (ticket: any) => {
  // Count existing registrations for this ticket
  const registrationCount = await FormRegistration.countDocuments({
    ticketId: ticket._id,
  });

  // Compute the next number
  const nextNumber = ticket.startCount + registrationCount;

  // Pad with leading zeros (5 digits minimum, adjust if needed)
  const paddedNumber = nextNumber.toString().padStart(5, "0");

  // Return badge number with prefix
  return `${ticket.serialNoPrefix}-${paddedNumber}`;
};

// Get registration by ID
export const getRegistrationController = async (
  req: Request,
  res: Response
) => {
  try {
    const { registrationId } = req.params;

    if (!registrationId) {
      return ErrorResponse(res, "Registration ID is required.", {
        errorType: "REQUIRE_PARAMETER",
      });
    }

    const registration = await FormRegistration.findById(registrationId)
      .populate("ticketId")
      .populate("eventId");

    if (!registration) {
      return ErrorResponse(res, "Registration not found.", {
        errorType: "NOT_FOUND",
      });
    }

    return successResponse(
      res,
      "Registration retrieved successfully",
      registration
    );
  } catch (error: any) {
    loggerMsg("Error in getRegistrationController:", error);
    return ErrorResponse(
      res,
      "An error occurred while fetching registration.",
      {
        errorType: "INTERNAL_SERVER_ERROR",
      }
    );
  }
};

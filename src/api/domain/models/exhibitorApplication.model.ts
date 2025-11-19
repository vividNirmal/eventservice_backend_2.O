import mongoose from "mongoose";
import EventHost from "../schema/eventHost.schema";
import { env } from "../../../infrastructure/env";
import { loggerMsg } from "../../lib/logger";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import eventUserSchema from "../schema/eventUser.schema";
import ExhibitorApplication from "../schema/exhibitorApplication.schema";
import ExhibitorForm from "../schema/exhibitorForm.schema";

const addImageUrls = (ticket: any) => {
  const baseUrl = env.BASE_URL;
  if (ticket) {
    if (ticket.bannerImage) {
      ticket.bannerImageUrl = `${baseUrl}/uploads/${ticket.bannerImage}`;
    }
    if (ticket.desktopBannerImage) {
      ticket.desktopBannerImageUrl = `${baseUrl}/uploads/${ticket.desktopBannerImage}`;
    }
    if (ticket.mobileBannerImage) {
      ticket.mobileBannerImageUrl = `${baseUrl}/uploads/${ticket.mobileBannerImage}`;
    }
    if (ticket.loginBannerImage) {
      ticket.loginBannerImageUrl = `${baseUrl}/uploads/${ticket.loginBannerImage}`;
    }
  }
  return ticket;
};

export const resolveExhibitorApplicationModel = async (
  exhibitorFormId: mongoose.Types.ObjectId,
  eventUserId: mongoose.Types.ObjectId,
  callback: (error: any, result: any) => void
) => {
  try {
    // Fetch ticket with event populated
    const exhibitorForm = await ExhibitorForm.findById(
      exhibitorFormId
    ).populate("eventId");
    if (!exhibitorForm)
      return callback(
        { message: "Exhibitor form not found.", errorType: "NOT_FOUND" },
        null
      );

    // Check if application already exists
    const existingApplication = await ExhibitorApplication.findOne({
      exhibitorFormId,
      eventUser: eventUserId,
    });

    // If already registered once
    if (existingApplication) {
      return callback(null, {
        hasApplied: true,
        exhibitorApplication: existingApplication,
      });
    }

    // Not registered yet
    return callback(null, {
      hasApplied: false,
      exhibitorApplication: null,
    });
  } catch (error) {
    return callback(error, null);
  }
};

/**
 * Store exhibitor application form data
 */
export const storeExhibitorApplicationModel = async (
  formData: any,
  files: Express.Multer.File[],
  eventUserId: string,
  callback: (error: any, result: any) => void
) => {
  try {
    const { exhibitorFormId, ...dynamicFormData } = formData;

    // Validate required fields
    if (!exhibitorFormId) {
      return callback(
        {
          message: "Exhibitor form ID is required.",
          errorType: "REQUIRE_PARAMETER",
        },
        null
      );
    }

    if (!eventUserId) {
      return callback(
        {
          message: "Event user ID is required.",
          errorType: "REQUIRE_PARAMETER",
        },
        null
      );
    }

    // Check if user has already applied for this exhibitor form
    const existingApplication = await ExhibitorApplication.findOne({
      exhibitorFormId: new mongoose.Types.ObjectId(exhibitorFormId),
      eventUser: new mongoose.Types.ObjectId(eventUserId),
    });

    if (existingApplication) {
      return callback(
        {
          message: "You have already applied for this exhibitor form.",
          errorType: "ALREADY_APPLIED",
        },
        null
      );
    }

    // Process uploaded files (store locally instead of AWS)
    const processedFormData = { ...dynamicFormData };
    const filesByField: { [key: string]: Express.Multer.File[] } = {};

    // Group files by field name
    files?.forEach((file) => {
      if (!filesByField[file.fieldname]) {
        filesByField[file.fieldname] = [];
      }
      filesByField[file.fieldname].push(file);
    });

    Object.keys(filesByField).forEach((fieldName) => {
      const fileArray = filesByField[fieldName];
      if (fileArray.length === 1) {
        processedFormData[fieldName] = `${(fileArray[0] as any).uploadFolder}/${
          fileArray[0].filename
        }`;
      } else {
        processedFormData[fieldName] = fileArray.map(
          (f) => `${(f as any).uploadFolder}/${f.filename}`
        );
      }
    });

    // Create exhibitor application
    const exhibitorApplication = new ExhibitorApplication({
      exhibitorFormId: new mongoose.Types.ObjectId(exhibitorFormId),
      eventUser: new mongoose.Types.ObjectId(eventUserId),
      formData: processedFormData,
      approved: false, // Default to false, can be approved later by admin
    });

    await exhibitorApplication.save();

    // Prepare response
    const responseData = {
      applicationId: exhibitorApplication._id,
      exhibitorFormId: exhibitorFormId,
      createdAt: exhibitorApplication.createdAt,
      approved: exhibitorApplication.approved,
    };

    callback(null, responseData);
  } catch (error: any) {
    console.error("Error storing exhibitor application:", error);
    callback(
      {
        message: error.message || "Failed to store exhibitor application",
        errorType: "INTERNAL_ERROR",
      },
      null
    );
  }
};

export const getAllExhibitorApplicationsModel = async (
  eventUserId: mongoose.Types.ObjectId,
  filters: any = {},
  pagination: any = { page: 1, limit: 10 },
  callback: (error: any, result: any) => void
) => {
  try {
    const { search } = filters;
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery: any = {};

    // Count total applications
    const totalCount = await ExhibitorApplication.countDocuments({
      eventUser: eventUserId,
    });

    if (search) {
      searchQuery.$or = [
        { "formData.name": { $regex: search, $options: "i" } },
        { "formData.email": { $regex: search, $options: "i" } },
      ];
    }
    searchQuery.eventUser = eventUserId;

    // Fetch applications
    const applications = await ExhibitorApplication.find(searchQuery)
      .populate({
        path: "exhibitorFormId",
        populate: [
          { path: "companyId", select: "company_name" },
          { path: "eventId", select: "eventName" },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return callback(null, {
      applications,
      pagination: {
        currentPage: page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    return callback(
      {
        message: "Failed to fetch exhibitor applications",
        errorType: "INTERNAL_ERROR",
      },
      null
    );
  }
};

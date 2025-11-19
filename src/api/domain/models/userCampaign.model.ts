// domain/models/userCampaign.model.js
import { loggerMsg } from "../../lib/logger";
import UserCampaignSchema, {
  IUserCampaign,
} from "../schema/userCampaign.schema";
import mongoose from "mongoose";
import XLSX from "xlsx";
import fs from "fs";
import schedule from "node-schedule";
import { EmailServiceNew } from "../../services/sendEmail.service";
import UserTemplate from "../schema/userTemplate.schema";
import { compileTemplate } from "../../services/templateService";
import path from "path";
import { sendCampaignEmails, getFullFilePath, readExcelContacts } from "../../services/batchEmailService";


/**
 * Schedule a campaign
 */
const scheduleCampaign = (campaign: any) => {
  try {
    const job = schedule.scheduleJob(campaign.scheduledAt, async () => {
      try {
        loggerMsg("info", `Executing scheduled campaign: ${campaign._id}`);
        await sendCampaignEmails(campaign._id);
      } catch (error: any) {
        loggerMsg(
          "error",
          `Error in scheduled job for ${campaign._id}: ${error.message}`
        );
      }
    });

    return job;
  } catch (error: any) {
    console.log("error>>sending", error);
    loggerMsg(
      "error",
      `Error scheduling campaign ${campaign._id}: ${error.message}`
    );
    throw error;
  }
};

/**
 * Create user campaign
 */
export const createUserCampaign = async (
  campaignData: Partial<IUserCampaign>,
  companyId: mongoose.Types.ObjectId,
  eventId: mongoose.Types.ObjectId,
  excelFilePath: string // Relative path only
) => {
  try {
    if (typeof campaignData.scheduled === "string") {
      campaignData.scheduled = campaignData.scheduled === "true";
    }

    // Check if campaign with same name exists for this event
    const existing = await UserCampaignSchema.findOne({
      name: campaignData.name,
      eventId,
    });

    if (existing) {
      return {
        success: false,
        message: "Campaign with this name already exists for this event",
      };
    }

    // Read contacts from Excel to get count
    const contacts = readExcelContacts(excelFilePath);
    const totalContacts = contacts.length;

    if (totalContacts === 0) {
      return {
        success: false,
        message:
          "Excel file must contain at least one contact with email address",
      };
    }

    const newCampaign = new UserCampaignSchema({
      ...campaignData,
      excelFile: excelFilePath,
      totalContacts,
      companyId,
      eventId,
      status: "pending",
      batchSize: campaignData.batchSize || 100, // #batch
      batchInterval: campaignData.batchInterval || 1,
    });

    const savedCampaign = await newCampaign.save();

    if (campaignData.scheduled === false) {
      // Start batch processing immediately
      sendCampaignEmails(savedCampaign._id);
    } else if (campaignData.scheduledAt) {
      scheduleCampaign(savedCampaign);
    }

    loggerMsg("info", `User campaign created: ${savedCampaign._id}`);

    return {
      success: true,
      data: savedCampaign,
      message: "Campaign created successfully",
    };
  } catch (error: any) {
    loggerMsg("error", `Error creating user campaign: ${error.message}`);
    return {
      success: false,
      message: "Failed to create campaign",
      error: error.message,
    };
  }
};

/**
 * Update user campaign
 */
export const updateUserCampaign = async (
  id: mongoose.Types.ObjectId,
  updateData: Partial<IUserCampaign>,
  companyId: mongoose.Types.ObjectId,
  excelFilePath?: string
) => {
  try {
    if (updateData.name) {
      const existing = await UserCampaignSchema.findOne({
        _id: { $ne: id },
        name: updateData.name,
        eventId: updateData.eventId,
      });
      if (existing) {
        return {
          success: false,
          message: "Campaign with this name already exists for this event",
        };
      }
    }

    // If new Excel file provided, update contacts count
    if (excelFilePath) {
      const contacts = readExcelContacts(excelFilePath);
      updateData.totalContacts = contacts.length;
      updateData.excelFile = excelFilePath;

      if (contacts.length === 0) {
        return {
          success: false,
          message:
            "Excel file must contain at least one contact with email address",
        };
      }
    }

    const updated = await UserCampaignSchema.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return {
        success: false,
        message: "Campaign not found",
      };
    }

    // Reschedule if schedule was updated
    if (updateData.scheduledAt) {
      scheduleCampaign(updated);
    }

    loggerMsg("info", `User campaign updated: ${id}`);

    return {
      success: true,
      data: updated,
      message: "Campaign updated successfully",
    };
  } catch (error: any) {
    loggerMsg("error", `Error updating user campaign: ${error.message}`);
    return {
      success: false,
      message: "Failed to update campaign",
      error: error.message,
    };
  }
};

/**
 * Delete user campaign by ID
 */
export const deleteUserCampaignById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const deleted = await UserCampaignSchema.findByIdAndDelete(id);
    if (!deleted) return callback(new Error("Campaign not found"));

    // Delete the Excel file from server using relative path
    const fullPath = getFullFilePath(deleted.excelFile);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    callback(null, { campaign: deleted });
  } catch (error: any) {
    loggerMsg("error", `Error deleting user campaign: ${error}`);
    callback(error, null);
  }
};

/**
 * Get all user campaigns with pagination
 */
export const getAllUserCampaigns = async (
  callback: (error: Error | null, result?: any) => void,
  page: number = 1,
  limit: number = 10,
  search?: string,
  eventId?: string,
  companyId?: string
) => {
  try {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (eventId) query.eventId = eventId;
    if (companyId) query.companyId = companyId;

    const campaigns = await UserCampaignSchema.find(query)
      .populate("templateId", "name subject")
      .populate("eventId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalData = await UserCampaignSchema.countDocuments(query);

    callback(null, {
      campaigns,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalData / limit),
        totalData,
        limit,
      },
    });
  } catch (error: any) {
    console.log("GET error", error);
    loggerMsg("error", `Error fetching user campaigns: ${error}`);
    callback(error, null);
  }
};

/**
 * Get user campaign by ID
 */
export const getUserCampaignById = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const campaign = await UserCampaignSchema.findById(id)
      .populate("templateId")
      .populate("eventId")
      .populate("companyId");

    if (!campaign) return callback(new Error("Campaign not found"));

    callback(null, { campaign });
  } catch (error: any) {
    loggerMsg("error", `Error fetching user campaign by ID: ${error}`);
    callback(error, null);
  }
};

/**
 * Send campaign immediately
 */
export const sendCampaignNow = async (
  id: string,
  callback: (error: Error | null, result?: any) => void
) => {
  try {
    const campaign = await UserCampaignSchema.findById(id);
    if (!campaign) return callback(new Error("Campaign not found"));

    // Start sending emails in background
    sendCampaignEmails(id);

    callback(null, { message: "Campaign sending started" });
  } catch (error: any) {
    loggerMsg("error", `Error starting campaign: ${error}`);
    callback(error, null);
  }
};

export const restoreScheduledCampaigns = async () => {
  const campaigns = await UserCampaignSchema.find({
    scheduled: true,
    scheduledAt: { $gte: new Date() }, // future only
    status: "pending",
  });

  campaigns.forEach((c) => {
    try {
      scheduleCampaign(c);
    } catch (err: any) {
      loggerMsg("error", `Failed to restore campaign ${c._id}: ${err.message}`);
    }
  });

  console.log("Restored scheduled jobs:", campaigns.length);
};

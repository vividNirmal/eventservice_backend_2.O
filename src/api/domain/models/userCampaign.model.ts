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

/**
 * Helper function to get full path from relative path
 */
const getFullFilePath = (relativePath: any) => {
  return path.join(process.cwd(), "uploads", relativePath);
};

/**
 * Read Excel file and extract contacts
 */
const readExcelContacts = (relativePath: any) => {
  try {
    const fullPath = getFullFilePath(relativePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Excel file not found at: ${fullPath}`);
    }

    const workbook = XLSX.readFile(fullPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const contacts = data
      .map((row: any, index) => ({
        email: row.email || row.Email || row.EMAIL,
        name: row.name || row.Name || row.NAME || `Contact ${index + 1}`,
        contact:
          row.contact ||
          row.Contact ||
          row.CONTACT ||
          row.phone ||
          row.Phone ||
          row.PHONE,
        // Add any other fields from Excel
        ...row,
      }))
      .filter((contact) => contact.email); // Only include rows with email

    console.log(`Found ${contacts.length} contacts in Excel file`);
    return contacts;
  } catch (error: any) {
    loggerMsg("error", `Error reading Excel file: ${error.message}`);
    throw new Error(`Failed to read Excel file: ${error.message}`);
  }
};

/**
 * Send campaign emails
 */
const sendCampaignEmails = async (campaignId: any) => {
  let campaign: any;
  try {
    campaign = await UserCampaignSchema.findById(campaignId)
      .populate("templateId")
      .populate("eventId");

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const contacts = readExcelContacts(campaign.excelFile);

    campaign.totalContacts = contacts.length;

    let sentCount = 0;
    let failedCount = 0;
    const errors = [];

    // Get template
    const template = await UserTemplate.findById(campaign.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Send emails to each contact
    for (const contact of contacts) {
      try {
        const templateData = {
          name: contact.name,
          email: contact.email,
          contact: contact.contact,
          eventName: campaign.eventId?.name || "Event",
          campaignName: campaign.name,
          // Add more template variables as needed
          ...contact,
        };

        const compiledSubject = compileTemplate(
          template.subject || "",
          templateData
        );
        const compiledContent = compileTemplate(template.content, templateData);

        const emailOptions: any = {
          to: contact.email,
          subject: compiledSubject,
          htmlContent: compiledContent,
        };

        // Add template attachments if any
        if (template.attachments?.length > 0) {
          emailOptions.attachments = template.attachments.map((att) => ({
            filename: att.originalName || att.filename,
            path: att.path,
            contentType: att.mimetype,
          }));
        }

        await EmailServiceNew.sendEmail(emailOptions);
        sentCount++;

        // Update progress every 10 emails
        if (sentCount % 10 === 0) {
          campaign.sentCount = sentCount;
          campaign.failedCount = failedCount;
          await campaign.save();
        }
      } catch (error: any) {
        console.log("error>>sending inter", error);
        loggerMsg(
          "error",
          `Failed to send email to ${contact.email}: ${error.message}`
        );
        failedCount++;
        errors.push(`${contact.email}: ${error.message}`);

        // Update failed count
        campaign.failedCount = failedCount;
        await campaign.save();
      }
    }

    // Final update
    campaign.sentCount = sentCount;
    campaign.failedCount = failedCount;
    campaign.status = failedCount === 0 ? "completed" : "failed";

    if (errors.length > 0) {
      campaign.errorMessage = `Failed to send ${failedCount} emails. First error: ${errors[0]}`;
    }

    await campaign.save();
    loggerMsg(
      "info",
      `Campaign ${campaignId} completed: ${sentCount} sent, ${failedCount} failed`
    );
  } catch (error: any) {
    loggerMsg(
      "error",
      `Error in send CampaignEmails for campaign ${campaignId}: ${error.message}`
    );

    if (campaign) {
      campaign.status = "failed";
      campaign.errorMessage = error.message;
      await campaign.save();
    }
  }
};

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
      status: "pending", // Simplified since it's always "pending"
    });

    const savedCampaign = await newCampaign.save();

    if (campaignData.scheduled === false) {
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

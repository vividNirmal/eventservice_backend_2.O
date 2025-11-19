// services/batchEmailService.js
import { loggerMsg } from "../lib/logger";
import UserCampaign from "../domain/schema/userCampaign.schema";
import UserTemplate from "../domain/schema/userTemplate.schema";
import { compileTemplate } from "./templateService";
import { EmailServiceNew } from "./sendEmail.service";
import XLSX from "xlsx";
import fs from "fs";
import path from "path";

/**
 * Process campaign emails in batches
 */
export const sendCampaignEmails = async (campaignId: any) => {
    try {
        const campaign = await UserCampaign.findById(campaignId)
            .populate("templateId")
            .populate("eventId");

        if (!campaign) {
            throw new Error("Campaign not found");
        }

        // Mark as processing
        campaign.status = "processing";
        campaign.isProcessing = true;
        await campaign.save();

        const contacts = readExcelContacts(campaign.excelFile);
        const template = await UserTemplate.findById(campaign.templateId);
        
        if (!template) {
            throw new Error("Template not found");
        }

        // Calculate batches
        const batchSize = campaign.batchSize || 100; // #batch
        const totalBatches = Math.ceil(contacts.length / batchSize);
        campaign.totalBatches = totalBatches;
        await campaign.save();

        // Process first batch immediately
        await processBatch(campaign, template, contacts, 0, batchSize);

        loggerMsg("info", `Campaign ${campaignId} batch processing started: ${totalBatches} batches`);

    } catch (error: any) {
        console.log(`Error starting batch processing for campaign ${campaignId}:`, error);
        loggerMsg("error", `Error starting batch processing for campaign ${campaignId}: ${error.message}`);
        
        const campaign = await UserCampaign.findById(campaignId);
        if (campaign) {
            campaign.status = "failed";
            campaign.errorMessage = error.message;
            campaign.isProcessing = false;
            await campaign.save();
        }
    }
};

/**
 * Process a single batch
 */
const processBatch = async (campaign: any, template: any, contacts: any, batchIndex: any, batchSize: any) => {
    try {
        const startIndex = batchIndex * batchSize;
        const endIndex = Math.min(startIndex + batchSize, contacts.length);
        const batchContacts = contacts.slice(startIndex, endIndex);

        console.log(`Processing batch ${batchIndex + 1}/${campaign.totalBatches} with ${batchContacts.length} contacts`);

        let batchSentCount = 0;
        let batchFailedCount = 0;
        const errors = [];

        for (const contact of batchContacts) {
            try {
                const templateData = {
                    name: contact.name,
                    email: contact.email,
                    contact: contact.contact,
                    eventName: campaign.eventId?.name || "Event",
                    campaignName: campaign.name,
                    ...contact,
                };

                const compiledSubject = compileTemplate(template.subject || "", templateData);
                const compiledContent = compileTemplate(template.content, templateData);

                const emailOptions: any = {
                    to: contact.email,
                    subject: compiledSubject,
                    htmlContent: compiledContent,
                };

                // Add template attachments if any
                if (template.attachments?.length > 0) {
                    emailOptions.attachments = template.attachments.map((att: any) => ({
                        filename: att.originalName || att.filename,
                        path: att.path,
                        contentType: att.mimetype,
                    }));
                }

                await EmailServiceNew.sendEmail(emailOptions);
                batchSentCount++;

            } catch (error: any) {
                console.log(`Failed to send email to ${contact.email}:`, error);
                batchFailedCount++;
                errors.push(`${contact.email}: ${error.message}`);
            }
        }

        // Update campaign progress
        await UserCampaign.findByIdAndUpdate(campaign._id, {
            $inc: {
                sentCount: batchSentCount,
                failedCount: batchFailedCount
            },
            currentBatch: batchIndex + 1,
            ...(batchFailedCount > 0 && {
                errorMessage: `Batch ${batchIndex + 1}: ${errors.slice(0, 3).join('; ')}`
            })
        });

        // Check if there are more batches
        const nextBatchIndex = batchIndex + 1;
        if (nextBatchIndex < campaign.totalBatches) {
            // Schedule next batch after interval
            const intervalMs = (campaign.batchInterval || 1) * 60 * 1000;
            setTimeout(() => {
                processBatch(campaign, template, contacts, nextBatchIndex, batchSize);
            }, intervalMs);
        } else {
            // Campaign completed
            const updatedCampaign = await UserCampaign.findById(campaign._id);
            if (updatedCampaign) {
                updatedCampaign.status = updatedCampaign.failedCount === 0 ? "completed" : "failed";
                updatedCampaign.isProcessing = false;
                await updatedCampaign.save();
            }
            loggerMsg("info", `Campaign ${campaign._id} completed`);
        }

    } catch (error: any) {
        console.log(`Error processing batch ${batchIndex} for campaign ${campaign._id}:`, error);
        loggerMsg("error", `Error processing batch ${batchIndex} for campaign ${campaign._id}: ${error.message}`);
        
        // Mark campaign as failed
        await UserCampaign.findByIdAndUpdate(campaign._id, {
            status: "failed",
            errorMessage: `Batch ${batchIndex} failed: ${error.message}`,
            isProcessing: false
        });
    }
};

/**
 * Helper function to get full path from relative path
 */
export const getFullFilePath = (relativePath: any) => {
  return path.join(process.cwd(), "uploads", relativePath);
};

/**
 * Read Excel file and extract contacts
 */
export const readExcelContacts = (relativePath: any) => {
  try {
    const fullPath = getFullFilePath(relativePath);
    console.log("getFullFilePath for excel>>>>>>>>>>>>✅✅✅", fullPath);

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
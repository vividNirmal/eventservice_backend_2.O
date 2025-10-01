import mongoose from "mongoose";
import {
  successCreated,
  successResponse,
  ErrorResponse,
} from "../../helper/apiResponse";
import participantUsers from "../../domain/schema/participantUsers.schema";
import EventParticipant from "../../domain/schema/eventParticipant";
import { loggerMsg } from "../../lib/logger";
import nodemailer from "nodemailer";
import path from "path";
import QRCode from "qrcode";
import eventSchema from "../../domain/schema/event.schema";
import participantUsersSchema from "../../domain/schema/participantUsers.schema";
import eventParticipantSchema from "../../domain/schema/eventParticipant";
import { env } from "process";
import fs from "fs";
import AWS from "aws-sdk";
import UsersOtp from "../schema/userOtp.schema";
import { EmailService } from "../../services/sendEmail.service";
import eventParticipant from "../../domain/schema/eventParticipant";
import { Console } from "console";
import eventHostSchema from "../schema/eventHost.schema";
import ticketSchema from "../schema/ticket.schema";

interface ParticipantUsersData {
  event_id?: string;
  user_token?: string;
  form_type?: string;
  image_url?: string;
  face_id?: string;
  [key: string]: any; // Allow any dynamic fields
}

interface ParticipantUsersDataUpdate {
  participant_user_id?: string;
  [key: string]: any; // Allow any dynamic fields for updates
}
const qrDirectory = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "..",
  "uploads"
);

if (!fs.existsSync(qrDirectory)) {
  fs.mkdirSync(qrDirectory, { recursive: true });
}

export const storeParticipantUser = async (
  participantUserData: ParticipantUsersData,
  callback: (error: any, result: any) => void
) => {
  try {
    console.log('🔧 Store Participant User - Input Data:', {
      event_id: participantUserData.event_id,
      user_token: participantUserData.user_token,
      form_type: participantUserData.form_type,
      root_level_email: participantUserData.email,
      all_data: participantUserData
    });
    
    // Process dynamic form data if it exists as a string
    let processedDynamicFields: { [key: string]: any } = {};
    
    if (participantUserData.dynamic_form_data && typeof participantUserData.dynamic_form_data === 'string') {
      try {
        // Parse the stringified JSON
        const parsedData = JSON.parse(participantUserData.dynamic_form_data) || {};
        processedDynamicFields = parsedData;
      } catch (error) {
        // If parsing fails, fall back to using individual fields
      }
    }
    
    // Extract email from either parsed data or individual fields for user identification
    const emailField = participantUserData.email || // Check root-level email first
                      processedDynamicFields.email || 
                      processedDynamicFields.email_address || 
                      participantUserData.email_address || '';
    
    if (!emailField) {
      return callback(new Error("Email is required for participant user identification"), null);
    }
    
    // Prepare dynamic fields - use parsed data if available, otherwise extract from individual fields
    const excludedSystemFields = ['event_id', 'user_token', 'form_type', 'image_url', 'face_id', 'dynamic_form_data'];
    
    let dynamicFields: { [key: string]: any };
    
    if (Object.keys(processedDynamicFields).length > 0) {
      // Use the parsed dynamic form data
      dynamicFields = processedDynamicFields;
    } else {
      // Fall back to extracting individual fields
      dynamicFields = Object.keys(participantUserData).reduce((acc: { [key: string]: any }, key) => {
        if (!excludedSystemFields.includes(key)) {
          acc[key] = participantUserData[key];
        }
        return acc;
      }, {});
    }
    
    // Ensure email field exists in dynamic_fields for proper indexing
    // Use the email we found earlier and make sure it's not null
    if (emailField && emailField.trim() !== '') {
      // If we have email_address but no email field, add email field
      if (!dynamicFields.email && dynamicFields.email_address) {
        dynamicFields.email = dynamicFields.email_address;
      }
      // If we have email but no email_address field, add email_address field  
      if (!dynamicFields.email_address && dynamicFields.email) {
        dynamicFields.email_address = dynamicFields.email;
      }
      // Ensure at least one email field exists and is not null
      if (!dynamicFields.email) {
        dynamicFields.email = emailField;
      }
    }
    
    // Remove any null or undefined email fields that might cause index issues
    Object.keys(dynamicFields).forEach(key => {
      if ((key === 'email' || key === 'email_address') && (!dynamicFields[key] || dynamicFields[key].trim() === '')) {
        delete dynamicFields[key];
      }
    });
    
    // Ensure we have a valid email before proceeding
    if (!emailField || emailField.trim() === '') {
      return callback(new Error("Valid email is required for participant user creation"), null);
    }
    
    // Check if user exists (based on email identification)
    // Build dynamic query based on what email fields we actually have
    const emailQueries = [];
    if (dynamicFields.email) {
      emailQueries.push({ 'dynamic_fields.email': dynamicFields.email });
      emailQueries.push({ email: dynamicFields.email }); // Also check root-level email
    }
    if (dynamicFields.email_address) {
      emailQueries.push({ 'dynamic_fields.email_address': dynamicFields.email_address });
      emailQueries.push({ email: dynamicFields.email_address }); // Also check root-level email
    }
    
    let existingUser = null;
    if (emailQueries.length > 0) {
      existingUser = await participantUsers.findOne({
        $or: emailQueries
      });
    }
    
    console.log('🔧 Existing User Check Result:', existingUser ? 'Found' : 'Not Found');
    
    let savedUser;
    
    if (existingUser) {
      console.log('🔧 Updating Existing User');
      // Update the existing user's dynamic fields and root-level email
      existingUser.email = emailField; // Update root-level email field
      existingUser.dynamic_fields = {
        ...existingUser.dynamic_fields,
        ...dynamicFields
      };
      savedUser = await existingUser.save();
    } else {
      console.log('🔧 Creating New User');
      // Create new user with all dynamic fields and root-level email field
      const newParticipantUser = new participantUsers({
        email: emailField, // Set root-level email field to avoid null constraint issues
        dynamic_fields: dynamicFields
      });
      
      savedUser = await newParticipantUser.save();
    }
    
    // Get user ID for event participant creation
    const userId = savedUser._id;    // console.log("image_urlimage_urlimage_urlimage_urlimage_url",participantUserData.image_url);
    // console.log("face_idface_idface_idface_idface_idface_idface_idface_idface_idface_id",participantUserData.face_id)
    // check if the participant already exist then skip creating new participant
    const existingParticipant = await EventParticipant.findOne({
      participant_user_id: userId,
      event_id: participantUserData.event_id
    });

    // Generate Registration Number
    let registrationNumber = '';
    if (!existingParticipant) {
      // Get event details to find linked ticket
      let event_details_for_registration = await eventHostSchema.findById(participantUserData.event_id);
      if (!event_details_for_registration) {
        // Fallback to event schema if not found in eventHost
        event_details_for_registration = await eventSchema.findById(participantUserData.event_id);
      }
      
      if (event_details_for_registration?.ticketId) {
        console.log('🔧 Generating registration number for ticketId:', event_details_for_registration.ticketId);
        
        try {
          // Convert ticketId to ObjectId
          const ticketObjectId = new mongoose.Types.ObjectId(event_details_for_registration.ticketId);
          console.log('🔧 Converted ticketId to ObjectId:', ticketObjectId);
          // Find ticket details
          const ticket_details = await ticketSchema.findOne({ _id: ticketObjectId });
          console.log('🔧 Fetched Ticket Details:', ticket_details);

          if (ticket_details?.serialNoPrefix && ticket_details?.startCount != null || ticket_details?.startCount !== undefined) {
            console.log('🔧 Ticket details found - Prefix:', ticket_details.serialNoPrefix, 'StartCount:', ticket_details.startCount);
            
            // Find the highest registration number for this event to get next sequence
            const latestParticipant = await EventParticipant.findOne({
              event_id: participantUserData.event_id,
              registration_number: { $exists: true, $ne: null }
            }).sort({ registration_number: -1 }).limit(1);
            
            let nextNumber: number;
            
            if (latestParticipant?.registration_number) {
              // Extract numeric part from latest registration number
              const prefix = ticket_details.serialNoPrefix;
              const latestNumber = latestParticipant.registration_number.replace(prefix, '');
              const currentNumber = parseInt(latestNumber, 10) || parseInt(ticket_details.startCount.toString(), 10);
              nextNumber = currentNumber + 1;
              console.log('🔧 Latest registration found:', latestParticipant.registration_number, 'Next number:', nextNumber);
            } else {
              // First participant - use startCount
              nextNumber = parseInt(ticket_details.startCount.toString(), 10) || 0;
              console.log('🔧 First participant - starting with:', nextNumber);
            }
            
            // Format number with leading zeros (same length as startCount)
            const startCountLength = ticket_details.startCount.toString().length;
            const paddedNumber = nextNumber.toString().padStart(startCountLength, '0');
            registrationNumber = `${ticket_details.serialNoPrefix}${paddedNumber}`;
            
            console.log('🔧 Generated registration number:', registrationNumber);
          } else {
            console.log('⚠️ Ticket details incomplete - no prefix or startCount found');
          }
        } catch (error) {
          console.error('❌ Error generating registration number:', error);
        }
      } else {
        console.log('⚠️ No ticketId found in event details');
      }
    }

    let saveEventParticipants;
    if (!existingParticipant) {
    // Create EventParticipant with dynamic data and registration number
    let eventParticipantData: any = {
      participant_user_id: userId,
      event_id: participantUserData.event_id,
      token: participantUserData.user_token,
      image_url: participantUserData.image_url,
      face_id: participantUserData.face_id,
      registration_number: registrationNumber || null, // Add registration number
      // Store all dynamic form data in EventParticipant as well
      dynamic_form_data: dynamicFields,
      // Set default values for any required fields that might exist in EventParticipant schema
      visit_reason: dynamicFields.visit_reason || 'Dynamic Form Response',
      referral_source: dynamicFields.referral_source || 'Dynamic Form',
      company_activity: dynamicFields.company_activity || 'Dynamic Form Response'
    };

    console.log('🔧 Event Participant Data with Registration Number:', eventParticipantData);

    const EventParticipants = new EventParticipant(eventParticipantData);

    saveEventParticipants = await EventParticipants.save();
    } else {
      saveEventParticipants = existingParticipant;
    }

    // Generate QR Code immediately for response
    console.log('🔧 Generating QR code for immediate response...');
    
    const token = participantUserData.user_token;
    const baseUrl = env.BASE_URL;
    // Get event details for QR code - check both schemas
    let event_details_for_qr = await eventHostSchema.findById(participantUserData.event_id);
    if (!event_details_for_qr) {
      // Fallback to event schema if not found in eventHost
      event_details_for_qr = await eventSchema.findById(participantUserData.event_id);
    }

    let qrCodeBase64 = null;
    let responseData: any = {
      message: "Participant stored successfully",
      show_form: false, // Match getEventTokenDetails structure
      event: event_details_for_qr,
      user_token: token,
      slug: event_details_for_qr?.event_slug,
      EventParticipantData: saveEventParticipants,
      participantUser: savedUser
    };
    
    if (event_details_for_qr) {
      // Generate QR code data
      const participant_qr_details = JSON.stringify({
        user_token: token,
        event_id: event_details_for_qr?.id,
        event_slug: event_details_for_qr?.event_slug,
      });
      
      // Generate base64 QR code
      qrCodeBase64 = await QRCode.toDataURL(participant_qr_details);
      console.log('🔧 QR code generated successfully', qrCodeBase64);
      // Save QR code as file
      const qrFileName = saveQrImage(qrCodeBase64, token || 'default');
      saveEventParticipants.qr_image = qrFileName;
      await saveEventParticipants.save();
      
      // Add QR code data to response - match getEventTokenDetails structure
      responseData.base64Image = qrCodeBase64;
      responseData.qr_image_url = baseUrl + "/uploads/" + qrFileName;
      console.log("responseData.base64Image", responseData);
      
      // Add formatted event details to response
      if (event_details_for_qr?.event_logo) {
        event_details_for_qr.event_logo = baseUrl + "/uploads/" + event_details_for_qr.event_logo;
      }
      if (event_details_for_qr?.event_image) {
        event_details_for_qr.event_image = baseUrl + "/uploads/" + event_details_for_qr.event_image;
      }
      if (event_details_for_qr?.show_location_image) {
        event_details_for_qr.show_location_image = baseUrl + "/uploads/" + event_details_for_qr.show_location_image;
      }
      if (event_details_for_qr?.event_sponsor) {
        event_details_for_qr.event_sponsor = baseUrl + "/uploads/" + event_details_for_qr.event_sponsor;
      }
      
      // Format dates for frontend compatibility
      if (event_details_for_qr?.start_date && event_details_for_qr?.start_date.length > 0) {
        const startDate = new Date(event_details_for_qr.start_date[0]);
        const endDate = event_details_for_qr?.end_date && event_details_for_qr.end_date.length > 0 
          ? new Date(event_details_for_qr.end_date[0]) 
          : startDate;
          
        responseData.startDate = startDate.toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        responseData.startTime = startDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        responseData.endDate = endDate.toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        responseData.endTime = endDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      }
      
      responseData.event = event_details_for_qr;
      
      console.log('✅ QR code generated successfully for immediate response');
    }

    // Success - return complete data with QR code
    console.log('🔧 Participant saved successfully with QR code');
    
    callback(null, responseData);

    // Send email in background - don't block the response
    process.nextTick(async () => {
      try {
        console.log('📧 Starting background email process...');
        
        // Re-fetch event participant details to ensure we have the latest data
        const event_participant_details = await EventParticipant.findOne({ token });
        
        if (!event_participant_details || !event_details_for_qr) {
          console.log("Email skipped: Missing participant or event details");
          return;
        }

        // Generate email content with the existing QR code
        const qr_image_url = baseUrl + "/uploads/" + event_participant_details.qr_image;
        
        const participant_details = await participantUsers.findOne({
          _id: event_participant_details.participant_user_id,
        });

        if (!participant_details) {
          console.log("Email skipped: Participant user not found");
          return;
        }

    const startDates: string[] = event_details_for_qr?.start_date || [];
    const endDates: string[] = event_details_for_qr?.end_date || [];
    const filterDates: string[] = [];

    startDates.forEach((startDate, index) => {
      const endDate = endDates[index] || null;

      if (startDate) {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : null;

        const formattedDate = `${start.toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })} - ${start.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })} to ${
          end
            ? end.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
            : ""
        }`;

        filterDates.push(formattedDate);
      }
    });

    const detailsHTML = `
                      <ul class="list-unstyled mt-2">
                          ${filterDates
                            .map((date) => `<li class="mt-2">${date}</li>`)
                            .join("")}
                      </ul>
                  `;

    const participant_qr_details = JSON.stringify({
      user_token: token,
      event_id: event_details_for_qr?.id,
      event_slug: event_details_for_qr?.event_slug,
    });
    const base64Image = await QRCode.toDataURL(participant_qr_details);
    const qrFileName = saveQrImage(
      base64Image,
      event_participant_details.token
    );
    event_participant_details.qr_image = qrFileName;
    console.log("qrFileName_qrFileName_qrFileName_", qrFileName);
    await event_participant_details.save();
    const qr_iamge_url = baseUrl + "/uploads/" + qrFileName;
    console.log("qr_iamge_url_qr_iamge_url_qr_iamge_url", qr_iamge_url);
    const htmlContent =
      `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>` +
      event_details_for_qr?.event_title +
      ` QR Code Scanner</title>
                        <style>
                            body {
                                font-family: 'Arial', sans-serif;
                                margin: 0;
                                padding: 0;
                                background-color: #f9f9f9;
                            }
            
                            .container {
                                max-width: 800px;
                                margin: 50px auto;
                                background: white;
                                border: 1px solid #ddd;
                                border-radius: 20px;
                                padding: 20px;
                                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                            }
            
                            .text-center {
                                text-align: center;
                            }
            
                            .heading {
                                font-size: 24px;
                                font-weight: bold;
                                color: #333;
                                margin-bottom: 20px;
                            }
            
                            .subheading {
                                font-size: 16px;
                                font-weight: 500;
                                color: #555;
                            }
            
                            .qr-code {
                                margin: 20px 0;
                                width: 200px;
                                height: auto;
                            }
            
                            .details {
                                font-size: 14px;
                                color: #666;
                                margin-top: 20px;
                            }
            
                            .details img {
                                vertical-align: middle;
                                margin-right: 8px;
                            }
            
                            .button-group {
                                margin-top: 30px;
                                display: flex;
                                justify-content: center;
                                gap: 10px;
                            }
            
                            .button {
                                padding: 10px 20px;
                                font-size: 14px;
                                border-radius: 5px;
                                border: none;
                                cursor: pointer;
                                text-decoration: none;
                                color: white;
                                display: inline-block;
                            }
            
                            .button-primary {
                                background-color: #007bff;
                            }
            
                            .button-secondary {
                                background-color: #6c757d;
                            }
                            .mt-2{
                                margin-bottom: 10px;;
                            }
                            .list-unstyled {
                                list-style: none; 
                                padding-left: 0; 
                                margin: 0;        
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="text-center">
                                <img src="` +
      event_details_for_qr?.event_logo +
      `" alt="Event Logo" style="max-width: 100px; height: 100px; border-radius: 10px;">
                            </div>
            
                            <div class="text-center">
                                <p class="heading">` +
      event_details_for_qr?.event_title +
      `</p>
                                <p class="subheading">QR Code Scanner</p>
                            </div>
            
                            <div class="text-center">
                                <img src="` +
      qr_iamge_url +
      `" alt="QR Code" class="qr-code">
                            </div>
            
                            <div class="details text-center">
                                <h3>
                                    <b> Event Date: </b>
                                </h3>
                                    ` +
      detailsHTML +
      `
                                <p>
                                    <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-map-pin">
                                        <path d="M21 10c0 7.333-9 12-9 12s-9-4.667-9-12a9 9 0 1 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                    Address: ` +
      event_details_for_qr?.address +
      `
                                </p>
                            </div>
            
                            <div class="text-center">
                                <p class="subheading">Participant: ` +
      (participant_details?.dynamic_fields?.full_name || 
       `${participant_details?.dynamic_fields?.first_name || ''} ${participant_details?.dynamic_fields?.last_name || ''}`.trim() ||
       participant_details?.dynamic_fields?.email ||
       participant_details?.dynamic_fields?.email_address ||
       'Participant') +
      `</p>
                            </div>
                        </div>
                    </body>
                    </html>
                  `;
        
        console.log("event_details?.event_logo", event_details_for_qr?.event_logo);
        
        // Use EmailService instead of nodemailer directly
        try {
          await EmailService.sendEmail(
            emailField,
            "Your Event ID!",
            htmlContent
          );
          console.log("✅ Email sent successfully to:", emailField);
        } catch (emailError) {
          console.log("❌ Email sending failed:", emailError);
          // Don't throw error - email failure shouldn't affect participant creation
        }
        
      } catch (backgroundError) {
        console.error("Background email process failed:", backgroundError);
      }
    });
  } catch (error: any) {
    console.error('❌ Error in storeParticipantUser:', error);
    
    // Handle MongoDB duplicate key error specifically
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'email';
      const duplicateValue = error.keyValue ? error.keyValue[duplicateField] : 'unknown';
      console.error(`❌ Duplicate key error on field '${duplicateField}' with value '${duplicateValue}'`);
      
      // Try to find and return the existing user instead of failing
      try {
        const existingUser = await participantUsers.findOne({ [duplicateField]: duplicateValue });
        if (existingUser) {
          console.log('✅ Found existing user with duplicate email, returning existing user');
          return callback(null, existingUser);
        }
      } catch (findError) {
        console.error('❌ Error finding existing user:', findError);
      }
      
      return callback(new Error(`A user with this ${duplicateField} already exists: ${duplicateValue}`), null);
    }
    
    loggerMsg("error", `Error during participant user creation: ${error}`);
    return callback(error, null);
  }
};

function saveQrImage(base64String: string, fileName: string): string {
  console.log("__dirname__dirname__dirname", __dirname);
  const base64Data = base64String.replace(/^data:image\/png;base64,/, ""); // Remove prefix
  console.log("qrDirectory");
  const filePath = path.join(qrDirectory, `${fileName}.png`); // File path
  console.log("qrDirectory_qrDirectory_qrDirectory", qrDirectory);
  fs.writeFileSync(filePath, base64Data, "base64"); // Save file
  return `${fileName}.png`; // Return saved file path
}

export const loginOtpGenerateModel = async (
  userData: { email?: string; event?: string },
  callback: (error: any, result: any) => void
) => {
  try {
    let loginValue = "";
    if (userData.email !== "") loginValue = userData.email ?? "";
    console.log("loginValue", loginValue);
    if (!loginValue)
      return callback(new Error("Mobile Number is required."), null);

    // Determine if login is email or mobile
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginValue);
    
    // Search in dynamic_fields for email or contact
    const searchCriteria = isEmail
      ? {
          $or: [
            { 'dynamic_fields.email': loginValue },
            { 'dynamic_fields.email_address': loginValue }
          ]
        }
      : {
          $or: [
            { 'dynamic_fields.contact': loginValue },
            { 'dynamic_fields.phone_number': loginValue }
          ]
        };

    // Step 1: Find user from participantUsersSchema
    const participantUserData = await participantUsersSchema
      .findOne(searchCriteria)
      .lean();
    if (!participantUserData)
      return callback(new Error("User not found!"), null);

    // Step 2: Get QR Image from eventParticipantSchema
    const eventParticipant = await eventParticipantSchema.findOne({
      participant_user_id: participantUserData._id,
    });
    const qrImage = eventParticipant?.qr_image;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const baseUrl = process.env.BASE_URL;
    console.log("baseUrl", baseUrl);
    const qr_iamge_url = baseUrl + "/uploads/" + qrImage;
    const data = {
      otp: otp,
      userId: participantUserData._id,
      qrImage: qr_iamge_url || null,
    };

    await UsersOtp.deleteMany({ user: loginValue });

    const otpRecord = new UsersOtp({
      user: loginValue,
      otp,
      event: eventParticipant?.event_id || "N/A",
    });

    await otpRecord.save();
    // Step 3: Immediate callback
    callback(null, {
      message: "OTP process started",
      data: data,
    });

    // Step 4: Background OTP generation & email sending
    process.nextTick(async () => {
      try {
        const html =
          `
          <div style="font-family: Arial, sans-serif; padding: 10px;">
              <h2>OTP Request</h2>
              <p><strong>User:</strong> ${loginValue}</p>
              <p><strong>Generated OTP:</strong> <span style="font-size: 18px; color: #2d3748;">${otp}</span></p>
              <p>This OTP has been generated for verification.</p>
            <div class="text-center">
                <img src="` +
          qr_iamge_url +
          `" alt="QR Code" class="qr-code">
            </div>
              <br/>
              <p>Regards,</p>
          </div>
        `;
        
        // await EmailService.sendEmail(
        //   participantUserData?.email, // Use setting email or user email
        //   "OTP Request",
        //   html
        // );

        // Get email from dynamic_fields
        const userEmail = participantUserData?.dynamic_fields?.email || 
                         participantUserData?.dynamic_fields?.email_address;
        
        try {
          await EmailService.sendEmail(
            userEmail, // Use dynamic email field
            "OTP Request",
            html
          );
          loggerMsg("✅ OTP email sent successfully.");
        } catch (error) {
          loggerMsg("❌ OTP email sending failed:", String(error));
          throw error;
        }
        //         const mailOptions = {
        //                     from: 'info@tradingguruji.com',
        //                     to: participantUserData.email,
        //                     subject: 'Your Event ID!',
        //                     text: `Hello ${participantUserData.first_name},\n\nThank you for signing up! We're excited to have you onboard.\n\nBest Regards,\nYour Company Name`, // Customize the email body
        //                     html: html
        //                 };
        //                         const transporter = nodemailer.createTransport({
        //             host: "mail.tradingguruji.com",
        //             port: 465,
        //             secure: true,
        //             auth: {
        //               user: "info@tradingguruji.com",
        //               pass: "q&i9$]o*z&mi[9[w",
        //             },
        //             tls: {
        //     rejectUnauthorized: false
        //   }
        //           });

        //         try {
        //             transporter.sendMail(mailOptions, (error, info) => {
        //             if (error) {
        //                 console.error('Error sending email:', error);
        //                 return callback(error, null);
        //             }
        //             console.log('Email sent successfully:', info.response);
        //             callback(null, { message: 'Participant stored and email sent successfully' });
        //             });
        //         } catch (err) {
        //             console.log(err)
        //             return callback(null, { message: 'OTP generated and email sent successfully' });
        //         }
      } catch (bgError) {
        console.error("Background OTP process failed:", bgError);
      }
    });
  } catch (error) {
    console.error("Error during OTP initiation:", error);
    callback(new Error("Something went wrong!"), null);
  }
};

export const verifyOtpModel = async (
  userData: {
    contact?: string;
    otp?: string;
    event_slug?: string;
    scanner_type?: number;
  },
  callback: (error: any, result: any) => void
) => {
  try {
    const user = await participantUsersSchema
      .findOne({
        $or: [
          { 'dynamic_fields.contact': userData.contact },
          { 'dynamic_fields.phone_number': userData.contact }
        ]
      })
      .lean();
    if (!user) {
      return callback(new Error("User not found!"), null);
    }

    // ✅ Check OTP validity
    const userContact = user.dynamic_fields?.contact || user.dynamic_fields?.phone_number;
    const otpRecord = await UsersOtp.findOne({
      user: userContact,
      otp: userData.otp,
      status: "pending",
    });

    if (!otpRecord) {
      return callback(new Error("Invalid or expired OTP."), null);
    }

    const event_details = await eventSchema
      .findOne({
        event_slug: userData?.event_slug,
      })
      .lean();

    if (!event_details) {
      return callback(new Error("Event Details Not Found"), null);
    }

    const event_participant_details = await eventParticipant.findOne({
      participant_user_id: user._id.toString(),
      event_id: event_details._id.toString(),
    });

    if (!event_participant_details) {
      return callback(new Error("Participant User Not Found"), null);
    }

    const baseUrl = env.BASE_URL;

    const participant_details = await participantUsers.findOne({
      _id: event_participant_details?.participant_user_id,
    });

    if (!participant_details) {
      return callback(new Error("Participant User Not Found"), null);
    }
    var color_status = "";
    var scanning_msg = "";

    if (!event_participant_details) {
      return callback(new Error("Participant details not found"), null);
    }

    if (userData.scanner_type == 0) {
      // Check-in Process
      if (event_participant_details.status == "in") {
        scanning_msg = "You are already in the event";
        color_status = "yellow";
      } else {
        event_participant_details.checkin_time = new Date();
        event_participant_details.status = "in";
        await event_participant_details.save();
        scanning_msg = "You are now checked into the event";
        color_status = "green";
      }
    }

    if (userData?.scanner_type == 1) {
      // Check-out Process
      if (event_participant_details.status != "in") {
        scanning_msg = "You can't check out without checking in";
        color_status = "red";
      } else {
        event_participant_details.checkout_time = new Date();
        event_participant_details.status = "out";
        await event_participant_details.save();
        scanning_msg = "You are now checked out from the event";
        color_status = "green";
      }
    }
    event_participant_details.qr_image =
      baseUrl + "/uploads/" + event_participant_details.qr_image;
    const result = [];
    event_details.event_logo = `${env.BASE_URL}/${event_details.event_logo}`;
    event_details.event_image = `${env.BASE_URL}/${event_details.event_image}`;
    result.push(event_details);
    result.push(event_participant_details);
    result.push(participant_details);
    result.push({"color_status":color_status,"scanning_msg":scanning_msg});
    return callback(null, result);
  } catch (error) {
    console.error("Error during OTP verification:", error);
    callback(new Error("Something went wrong!"), null);
  }
};

export const updateParticipantUserModel = async (userData: ParticipantUsersDataUpdate, callback: (error: any, result: any) => void) => {
    try {
        const existingUser = await participantUsers.findOne({ _id: userData.participant_user_id });

        if (!existingUser) {
            return callback({ message: "User with this ID does not exist" }, null);
        }

        // Update dynamic fields - merge new data with existing data
        const { participant_user_id, ...updateData } = userData;
        
        existingUser.dynamic_fields = {
            ...existingUser.dynamic_fields,
            ...updateData
        };

        const updatedUser = await existingUser.save();

        return callback(null, { message: 'User Updated Successfully', updatedUser });

    } catch (error) {
        console.log(error);
        return callback({ message: "An error occurred", error }, null);
    }
}

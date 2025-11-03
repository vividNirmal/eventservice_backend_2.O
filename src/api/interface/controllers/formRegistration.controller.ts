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
  getFormRegistrationListModel,
  getFormRegistrationModel,
  resolveEmailModel,
  resolveFormUrlModel,
  storeFormRegistrationModel,
  updateFormRegistrationStatusModel,
  updateFormRegistrationModel
} from "../../domain/models/formRegistration.model";
import mongoose from "mongoose";
import FormRegistration from "../../domain/schema/formRegistration.schema";
import Ticket from "../../domain/schema/ticket.schema";
import EventHost from "../../domain/schema/eventHost.schema";
import QRCode from "qrcode";
import puppeteer from "puppeteer";
import EBadgeSetting from "../../domain/schema/eBadgeSetting.schema";

// Helper to append BASE_URL for file/image fields
const appendBaseUrlToFiles = (registration: any) => {
  const baseUrl = env.BASE_URL;
  if (!registration) return registration;

  // Direct file fields (stored at root level)
  const directFileFields = ["faceImageUrl", "qrImage"];
  directFileFields.forEach((field) => {
    if (registration[field]) {
      registration[`${field}Url`] = `${baseUrl}/uploads/${registration[field]}`;
    }
  });

  // Handle dynamic fields inside formData
  if (registration.formData && typeof registration.formData === "object") {
    Object.keys(registration.formData).forEach((key) => {
      const value = registration.formData[key];

      // Case 1: single file name string (e.g., "image1.png")
      if (typeof value === "string" && /\.(jpg|jpeg|png|gif|pdf|docx?)$/i.test(value)) {
        registration.formData[key] = `${baseUrl}/uploads/${value}`;
      }

      // Case 2: array of files (e.g., ["img1.png", "img2.jpg"])
      else if (Array.isArray(value)) {
        registration.formData[key] = value.map((file) =>
          typeof file === "string" && /\.(jpg|jpeg|png|gif|pdf|docx?)$/i.test(file)
            ? `${baseUrl}/uploads/${file}`
            : file
        );
      }
    });
  }

  return registration;
};

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
    const { id: registrationId } = req.params;
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

// export const generateFormRegistrationPdf = async (req: Request, res: Response) => {
//   try {
//     const { formRegistrationId } = req.body;
//     const baseUrl = env.BASE_URL;

//     if (!formRegistrationId) {
//       return ErrorResponse(res, "formRegistrationId is required");
//     }

//     const registration = await FormRegistration.findById(formRegistrationId)
//       .populate("ticketId")
//       .populate("eventId");

//     if (!registration) {
//       return ErrorResponse(res, "Form registration not found");
//     }

//     const ticket = registration.ticketId as any;
//     const event = registration.eventId as any;

//     if (event?.event_logo) event.event_logo = baseUrl + "/" + event.event_logo;
//     if (event?.event_image) event.event_image = baseUrl + "/" + event.event_image;
//     if (event?.show_location_image)
//       event.show_location_image = baseUrl + "/" + event.show_location_image;

//     // Create QR code (or use existing)
//     let qrCodeBase64 = registration.qrImage
//       ? baseUrl + "/uploads/" + registration.qrImage
//       : await QRCode.toDataURL(
//           JSON.stringify({
//             event_id: event?._id,
//             event_slug: event?.event_slug,
//             formRegistration_id: registration._id,
//           })
//         );

//     const formatDateTime = (date?: Date | string): string => {
//       if (!date) return "N/A";
//       const d = new Date(date);
//       const day = d.getDate();
//       const month = d.toLocaleString("default", { month: "long" });
//       const year = d.getFullYear();
//       const time = d.toLocaleTimeString([], {
//         hour: "2-digit",
//         minute: "2-digit",
//         hour12: true,
//       });
//       return `${day} ${month} ${year} - ${time}`;
//     };

//     const formattedDateRange = `${formatDateTime(event?.startDate)} to ${formatDateTime(event?.endDate)}`;

//     // Optional — Extract name/designation from dynamic form fields
//     const formData = registration.formData || {};
//     const name = event?.eventName || ""

//     const htmlContent = `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8" />
//         <title>Registration PDF</title>
//         <style>
//           body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
//           .card { border: 2px dashed #000; border-radius: 16px; padding: 16px; margin: 8px; }
//           .title { text-align: center; font-weight: bold; font-size: 18px; }
//           .center { text-align: center; }
//           img { max-width: 100%; height: auto; }
//           .details { background: #eee; border-radius: 8px; padding: 10px; margin: 10px 0; text-align: center; }
//         </style>
//       </head>
//       <body>
//         <table style="width:100%; border-collapse:collapse;">
//           <tr>
//             <td width="50%" class="card">
//               <div class="details">${formattedDateRange}<br>${event?.address || ""}</div>
//               <h3 class="center">${name}</h3>
//               <img src="${qrCodeBase64}" alt="QR Code" width="200" height="200" style="display:block;margin:10px auto;" />
//               <p class="center">Badge No: ${registration.badgeNo || "-"}</p>
//               ${
//                 registration.businessData?.category
//                   ? `<p class="center">Category: ${registration.businessData.category}</p>`
//                   : ""
//               }
//             </td>
//             <td width="50%" class="card">
//               ${
//                 event?.show_location_image
//                   ? `<img src="${event.show_location_image}" alt="Location Map" />`
//                   : `<p class="center">Event Details</p>`
//               }
//             </td>
//           </tr>
//         </table>
//       </body>
//       </html>
//     `;

//     // 🧾 Generate PDF
//     const browser = await puppeteer.launch({
//       headless: true,
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     });
//     const page = await browser.newPage();
//     await page.setContent(htmlContent, { waitUntil: "networkidle0" });

//     const pdfFileName = `${name.replace(/\s+/g, "_")}_badge.pdf`;
//     const tempFilePath = path.join(__dirname, pdfFileName);
//     await page.pdf({ path: tempFilePath, format: "A4", printBackground: true });
//     await browser.close();

//     // 📤 Send PDF file
//     if (fs.existsSync(tempFilePath)) {
//       res.set({
//         "Content-Type": "application/pdf",
//         "Content-Disposition": `attachment; filename="${pdfFileName}"`,
//       });
//       const stream = fs.createReadStream(tempFilePath);
//       stream.pipe(res);
//       res.on("finish", () => fs.unlinkSync(tempFilePath));
//     } else {
//       ErrorResponse(res, "Failed to generate PDF file");
//     }
//   } catch (error: any) {
//     console.error("❌ Error generating form registration PDF:", error);
//     return res.status(500).json({
//       status: "error",
//       message: "Error generating PDF",
//       error: error.message,
//     });
//   }
// };

export const generateBadgePdf = async (
  formRegistrationId: string,
  returnBuffer: boolean = false
): Promise<Buffer | string | null> => {
  try {
    const baseUrl = env.BASE_URL;

    // Fetch form registration with populated references
    const registration = await FormRegistration.findById(formRegistrationId)
      .populate({
        path: "ticketId",
        populate: { path: "registrationFormId" }
      })
      .populate("eventId")
      .lean();

    if (!registration) {
      throw new Error("Form registration not found");
    }

    const ticket = registration.ticketId as any;
    const event = registration.eventId as any;

    if (!ticket || !event) {
      throw new Error("Ticket or Event not found");
    }

    // Build map_array from ticket's registration form
    const map_array: Record<string, string> = {};
    const registrationForm = ticket.registrationFormId;
    
    if (registrationForm?.pages) {
      registrationForm.pages.forEach((page: any) => {
        page.elements?.forEach((element: any) => {
          if (element.mapField && element.fieldName) {
            map_array[element.mapField] = element.fieldName;
          }
        });
      });
    }

    // Find e-badge setting for this ticket
    const eBadgeSetting = await EBadgeSetting.findOne({
      ticketIds: ticket._id,
      eventId: event._id,
    }).populate("templateId");

    if (!eBadgeSetting || !eBadgeSetting.templateId) {
      throw new Error("E-Badge setting or template not found for this ticket");
    }

    const template = eBadgeSetting.templateId as any;

    // Generate QR Code
    let qrCodeBase64 = registration.qrImage
      ? `${baseUrl}/uploads/${registration.qrImage}`
      : await QRCode.toDataURL(
          JSON.stringify({
            event_id: event._id,
            event_slug: event.event_slug,
            formRegistration_id: registration._id,
          }),
          { width: 200, margin: 1 }
        );

    // Helper function to format dates
    const formatDateTime = (date?: Date | string): string => {
      if (!date) return "N/A";
      const d = new Date(date);
      const day = d.getDate();
      const month = d.toLocaleString("default", { month: "long" });
      const year = d.getFullYear();
      const time = d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return `${day} ${month} ${year} - ${time}`;
    };

    // Get form data
    const formData = registration.formData || {};
    
    // Helper function to get field value using map_array
    const getFieldValue = (fieldKey: string): string => {
      // If map_array has a mapping for this field, use it
      const mappedFieldName = map_array[fieldKey];
      
      if (mappedFieldName && formData[mappedFieldName]) {
        return formData[mappedFieldName];
      }
      const possibleFields = [fieldKey];
      
      for (const field of possibleFields) {
        if (formData[field]) {
          return formData[field];
        }
      }

      return "";
    };

    // Map field IDs to actual data using map_array
    const fieldDataMap: Record<string, string> = {
      first_name: getFieldValue("first_name"),
      last_name: getFieldValue("last_name"),
      email: registration.email || getFieldValue("email"),
      contact_no: getFieldValue("contact_no"),
      company_name: getFieldValue("company_name"),
      qrCode: qrCodeBase64,
      date: formatDateTime(event.startDate),
      badgeCategory: registration.businessData?.category || ticket.ticketCategory || "",
      badgeNo: registration.badgeNo || "",
    };

    console.log("fieldDataMap>>>>", fieldDataMap);

    // Parse HTML template
    const htmlTemplate = template.htmlContent;
    let finalHtml = htmlTemplate;

    // Find badge category if selected
    const badgeCategoryGroup = eBadgeSetting.fields?.find((f: any) =>
      f.field?.some((field: any) => field.id === "badgeCategory")
    );
    
    const selectedCategoryId = badgeCategoryGroup
      ? eBadgeSetting.fieldProperties?.[badgeCategoryGroup.combined_id || badgeCategoryGroup.id]?.categoryId
      : null;

    // Apply badge category colors if selected
    let categoryBackgroundColor = "";
    let categoryTextColor = "";
    
    if (selectedCategoryId) {
      const BadgeCategory = require("../../domain/schema/badgeCategory.schema").default;
      const category = await BadgeCategory.findById(selectedCategoryId);
      if (category) {
        categoryBackgroundColor = category.backgroundColor;
        categoryTextColor = category.textColor;
      }
    }

    // Build dynamic content based on e-badge settings
    let dynamicContent = "";
    const fixedPosition = eBadgeSetting.fixedPosition || false;

    for (const fieldGroup of eBadgeSetting.fields || []) {
      const groupId = fieldGroup.combined_id || fieldGroup.id;
      const props = eBadgeSetting.fieldProperties?.[groupId] || {};

      // Skip badge category field - it only applies colors
      if (fieldGroup.field?.some((f: any) => f.id === "badgeCategory")) {
        continue;
      }

      if (fieldGroup.combined_id && !fixedPosition) {
        // Combined fields - render in a flex container
        let combinedHtml = `<div style="display: flex; gap: 8px; align-items: center; margin-top: ${props.marginTop || "0mm"}; margin-left: ${props.marginLeft || "0mm"}; justify-content: ${
          props.position === "left" ? "flex-start" : props.position === "center" ? "center" : "flex-end"
        };">`;

        for (const field of fieldGroup.field) {
          combinedHtml += generateFieldHtml(field, props, fieldDataMap, false, categoryTextColor);
        }

        combinedHtml += "</div>";
        dynamicContent += combinedHtml;
      } else if (fieldGroup.combined_id && fixedPosition) {
        // Fixed position - render combined fields individually
        for (const field of fieldGroup.field) {
          dynamicContent += generateFieldHtml(field, props, fieldDataMap, true, categoryTextColor);
        }
      } else {
        // Single field
        const field = fieldGroup.field?.[0];
        if (field) {
          dynamicContent += generateFieldHtml(field, props, fieldDataMap, fixedPosition, categoryTextColor);
        }
      }
    }

    // Replace placeholder in template with dynamic content
    finalHtml = finalHtml.replace(
      /<div[^>]*id="badgeContent"[^>]*>.*?<\/div>/,
      `<div id="badgeContent" style="visibility: visible; position: relative; width: 100%; height: 100%;${
        categoryBackgroundColor ? ` background-color: ${categoryBackgroundColor};` : ""
      }${categoryTextColor ? ` color: ${categoryTextColor};` : ""}">${dynamicContent}</div>`
    );

    // Launch puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(finalHtml, { waitUntil: "networkidle0" });

    if (returnBuffer) {
      // Return PDF as buffer (for email attachment)
      const pdfUint8 = await page.pdf({
        format: "A4",
        printBackground: true,
      });
      // Ensure we return a Node Buffer (convert from Uint8Array if necessary)
      const pdfBuffer = Buffer.from(pdfUint8 as unknown as Uint8Array);
      await browser.close();
      return pdfBuffer as unknown as Buffer;
    } else {
      // Save to temp file and return path
      const pdfFileName = `${(fieldDataMap.first_name || "badge").replace(/\s+/g, "_")}_${registration.badgeNo || Date.now()}.pdf`;
      const tempFilePath = path.join(__dirname, pdfFileName);
      await page.pdf({ path: tempFilePath, format: "A4", printBackground: true });
      await browser.close();
      return tempFilePath;
    }
  } catch (error: any) {
    console.error("❌ Error generating badge PDF:", error);
    throw error;
  }
};


/**
 * Helper function to generate HTML for a single field
 */
function generateFieldHtml(
  field: any,
  props: any,
  fieldDataMap: Record<string, string>,
  fixedPosition: boolean,
  categoryTextColor: string
): string {
  const fieldValue = fieldDataMap[field.id] || field.name;
  const position = fixedPosition ? "absolute" : "relative";
  const marginStyles = fixedPosition
    ? `left: ${props.marginLeft || "0mm"}; top: ${props.marginTop || "0mm"};`
    : `margin-left: ${props.marginLeft || "0mm"}; margin-top: ${props.marginTop || "0mm"};`;

  if (field.type === "qrcode") {
    return `<div style="position: ${position}; ${marginStyles} display: flex; justify-content: ${
      props.position === "left" ? "flex-start" : props.position === "center" ? "center" : "flex-end"
    };">
      <img src="${fieldValue}" alt="QR Code" style="width: ${props.width || "20mm"}; height: ${props.height || "20mm"};" />
    </div>`;
  }

  return `<div style="position: ${position}; ${marginStyles} text-align: ${props.position || "left"}; font-family: ${
    props.fontFamily || "Arial"
  }; font-size: ${props.fontSize || "12pt"}; color: ${categoryTextColor || props.fontColor || "#000"}; font-weight: ${
    props.fontStyle === "bold" ? "bold" : "normal"
  }; text-transform: ${
    props.textFormat === "uppercase"
      ? "uppercase"
      : props.textFormat === "lowercase"
      ? "lowercase"
      : props.textFormat === "capitalize"
      ? "capitalize"
      : "none"
  };">${fieldValue}</div>`;
}

/**
 * API endpoint to generate and download PDF
 */
export const generateFormRegistrationPdf = async (req: Request, res: Response) => {
  try {
    const { formRegistrationId } = req.body;

    if (!formRegistrationId) {
      return ErrorResponse(res, "formRegistrationId is required");
    }

    // Generate PDF and get temp file path
    const tempFilePath = await generateBadgePdf(formRegistrationId, false);

    if (!tempFilePath || typeof tempFilePath !== "string") {
      return ErrorResponse(res, "Failed to generate PDF file");
    }

    // Send PDF file
    if (fs.existsSync(tempFilePath)) {
      const fileName = path.basename(tempFilePath);
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      });
      const stream = fs.createReadStream(tempFilePath);
      stream.pipe(res);
      res.on("finish", () => {
        // Clean up temp file after sending
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      });
    } else {
      ErrorResponse(res, "PDF file not found");
    }
  } catch (error: any) {
    console.error("❌ Error generating form registration PDF:", error);
    return res.status(500).json({
      status: "error",
      message: "Error generating PDF",
      error: error.message,
    });
  }
};

export const getFormRegistrationListController = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      eventId = "", 
      approved = "", 
      userTypeId = "",
      ticketId = "", // Add this line
      startDate = "", // Add this line
      endDate = "",   // Add this line
    } = req.query;

    getFormRegistrationListModel(
      parseInt(page as string),
      parseInt(limit as string),
      search as string,
      eventId as string,
      approved as string,
      userTypeId as string,
      ticketId as string, // Add this line
      startDate as string, // Add this line
      endDate as string,   // Add this line

      (error, result) => {
        if (error) {
          return ErrorResponse(res, error.message);
        }
        // Append BASE_URL to all image/file fields
        if (result?.registrations?.length) {
          result.data = result.registrations.map((r: any) => appendBaseUrlToFiles(r));
        }

        return successResponse(res, "Form registrations retrieved successfully", result);
      }
    );
  } catch (error) {
    console.error(error);
    return ErrorResponse(res, "An error occurred while fetching form registrations.");
  }
};

export const updateFormRegistrationStatusController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    if (typeof approved !== "boolean") {
      return ErrorResponse(res, "Approved status must be boolean (true/false).");
    }

    updateFormRegistrationStatusModel(id, approved, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(res, "Registration status updated successfully", result);
    });
  } catch (error) {
    return ErrorResponse(res, "Error updating registration status.");
  }
};

export const updateFormRegistrationController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return ErrorResponse(res, "Registration ID is required");
    }

    updateFormRegistrationModel(
      id,
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
          "Registration updated successfully",
          result
        );
      }
    );
  } catch (error) {
    return ErrorResponse(res, "An error occurred while updating registration.", {
      errorType: "INTERNAL_SERVER_ERROR",
    });
  }
};
import { Request, RequestHandler, Response } from "express";
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
  updateFormRegistrationModel,
  
} from "../../domain/models/formRegistration.model";
import mongoose from "mongoose";
import FormRegistration from "../../domain/schema/formRegistration.schema";
import Ticket from "../../domain/schema/ticket.schema";
import EventHost from "../../domain/schema/eventHost.schema";
import QRCode from "qrcode";
import puppeteer from "puppeteer";
import EBadgeSetting from "../../domain/schema/eBadgeSetting.schema";
import PaperBadgeSetting from "../../domain/schema/paperBadgeSetting.schema";

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
      if (
        typeof value === "string" &&
        /\.(jpg|jpeg|png|gif|pdf|docx?)$/i.test(value)
      ) {
        registration.formData[key] = `${baseUrl}/uploads/${value}`;
      }

      // Case 2: array of files (e.g., ["img1.png", "img2.jpg"])
      else if (Array.isArray(value)) {
        registration.formData[key] = value.map((file) =>
          typeof file === "string" &&
          /\.(jpg|jpeg|png|gif|pdf|docx?)$/i.test(file)
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

/**
 * Helper function to calculate field width in mm
 */
function getFieldWidth(
  field: any,
  props: any,
  fieldDataMap: Record<string, string>,
  isPreview: boolean = false
): number {
  if (field.type === "image") {
    return parseFloat(props.width) || 30;
  }

  if (field.type === "qrcode") {
    return parseFloat(props.width) || 20;
  }

  // For text fields, estimate based on font size and content length
  const fontSize = parseFloat(props.fontSize) || 12;
  const charWidth = fontSize * 0.6;

  let textLength = 0;
  if (isPreview) {
    // In preview mode, use field name or placeholder text for width calculation
    textLength = field.name?.length || field.id?.length || 10;
  } else {
    // In actual mode, use actual data from fieldDataMap
    const text = fieldDataMap[field.id] || "";
    textLength = text.length;
  }

  return (textLength * charWidth) / 3.78; // Convert pixels to mm (1mm ≈ 3.78px at 96dpi)
}

/**
 * Helper function to generate HTML for a single field
 * Updated with previousFieldsWidth parameter for proper spacing
 */
function generateFieldHtml(
  field: any,
  props: any,
  fieldDataMap: Record<string, string>,
  fixedPosition: boolean,
  categoryTextColor: string,
  isInCombinedGroup: boolean = false,
  fieldIndex: number = 0,
  totalFields: number = 1,
  previousFieldsWidth: number = 0
): string {
  const fieldValue = fieldDataMap[field.id] || "";
  const position = fixedPosition ? "absolute" : "relative";

  // Handle margins based on positioning mode
  let marginStyles = "";
  if (fixedPosition) {
    // For combined fields in fixed position, calculate position based on actual widths
    const baseLeft = parseFloat(props.marginLeft) || 0;
    const spacing = 2; // 2mm spacing between combined fields
    const offsetLeft = baseLeft + previousFieldsWidth + fieldIndex * spacing;

    marginStyles = `left: ${offsetLeft}mm; top: ${props.marginTop || "0mm"};`;
  } else if (!isInCombinedGroup) {
    // Only apply margins for non-combined fields
    marginStyles = `margin-left: ${props.marginLeft || "0mm"}; margin-top: ${
      props.marginTop || "0mm"
    };`;
  }

  // Handle Face Image
  if (field.type === "image") {
    const imageUrl = fieldValue || "";
    const imageHtml = imageUrl
      ? `<img src="${imageUrl}" alt="Face Image" style="width: 100%; height: 100%; object-fit: ${
          props.objectFit || "cover"
        }; display: block;" />`
      : `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: #999; font-size: 10px; height: 100%;">
           <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
             <circle cx="12" cy="7" r="4"></circle>
           </svg>
           <span style="margin-top: 8px;">No Image</span>
         </div>`;

    return `<div style="position: ${position}; ${marginStyles} display: flex; justify-content: ${
      props.position === "left"
        ? "flex-start"
        : props.position === "center"
        ? "center"
        : "flex-end"
    }; line-height: 0;">
      <div style="width: ${props.width || "30mm"}; height: ${
      props.height || "40mm"
    }; border-radius: ${
      props.borderRadius || "0px"
    }; overflow: hidden; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; border: 1px solid #ddd;">
        ${imageHtml}
      </div>
    </div>`;
  }

  // Handle QR Code
  if (field.type === "qrcode") {
    return `<div style="position: ${position}; ${marginStyles} display: flex; justify-content: ${
      props.position === "left"
        ? "flex-start"
        : props.position === "center"
        ? "center"
        : "flex-end"
    }; line-height: 0;">
      <img src="${fieldValue}" alt="QR Code" style="width: ${
      props.width || "20mm"
    }; height: ${props.height || "20mm"}; display: block;" />
    </div>`;
  }

  // Handle Text Fields
  const displayStyle = isInCombinedGroup ? "inline-block" : "block";

  return `<div style="position: ${position}; ${marginStyles} text-align: ${
    props.position || "left"
  }; font-family: ${props.fontFamily || "Roboto"}; font-size: ${
    props.fontSize || "12pt"
  }; color: ${categoryTextColor || props.fontColor || "#000"}; font-weight: ${
    props.fontStyle === "bold" ? "bold" : "normal"
  }; text-transform: ${
    props.textFormat === "uppercase"
      ? "uppercase"
      : props.textFormat === "lowercase"
      ? "lowercase"
      : props.textFormat === "capitalize"
      ? "capitalize"
      : "none"
  }; display: ${displayStyle}; line-height: 1.2; margin: ${
    isInCombinedGroup ? "0" : ""
  }; white-space: nowrap;">${fieldValue}</div>`;
}

/**
 * Helper function to generate PDF
 */
export const generateBadgePdf = async (
  formRegistrationId: string
): Promise<Buffer | null> => {
  try {
    const baseUrl = env.BASE_URL;

    // Fetch form registration with populated references
    const registration = await FormRegistration.findById(formRegistrationId)
      .populate({
        path: "ticketId",
        populate: { path: "registrationFormId" },
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
      // Special handling for specific field types
      if (fieldKey === "qrCode") {
        return qrCodeBase64;
      }

      if (fieldKey === "date") {
        return formatDateTime(event.startDate);
      }

      if (fieldKey === "badgeCategory") {
        return (
          registration.businessData?.category || ticket.ticketCategory || ""
        );
      }

      if (fieldKey === "badgeNo") {
        return registration.badgeNo || "";
      }

      if (fieldKey === "email") {
        return registration.email || formData.email || "";
      }

      if (fieldKey === "faceImage") {
        return registration.faceImageUrl
          ? `${baseUrl}/uploads/participants/${registration.faceImageUrl}`
          : "";
      }

      // For dynamic form fields: Use map_array mapping
      const mappedFieldName = map_array[fieldKey];

      if (mappedFieldName && formData[mappedFieldName]) {
        return formData[mappedFieldName];
      }

      // Fallback: Try direct field access
      if (formData[fieldKey]) {
        return formData[fieldKey];
      }

      return "";
    };

    // ✨ Dynamically build fieldDataMap based on e-badge setting fields
    const fieldDataMap: Record<string, string> = {};

    // Collect all unique field IDs from e-badge settings
    const allFieldIds = new Set<string>();

    for (const fieldGroup of eBadgeSetting.fields || []) {
      if (fieldGroup.field && Array.isArray(fieldGroup.field)) {
        fieldGroup.field.forEach((field: any) => {
          if (field.id) {
            allFieldIds.add(field.id);
          }
        });
      }
    }

    // Build fieldDataMap for all fields used in e-badge
    allFieldIds.forEach((fieldId) => {
      fieldDataMap[fieldId] = getFieldValue(fieldId);
    });    
    // Parse HTML template
    const htmlTemplate = template.htmlContent;
    let finalHtml = htmlTemplate;

    // Find badge category if selected
    const badgeCategoryGroup = eBadgeSetting.fields?.find((f: any) =>
      f.field?.some((field: any) => field.id === "badgeCategory")
    );

    const selectedCategoryId = badgeCategoryGroup
      ? eBadgeSetting.fieldProperties?.[
          badgeCategoryGroup.combined_id || badgeCategoryGroup.id
        ]?.categoryId
      : null;

    // Apply badge category colors if selected
    let categoryBackgroundColor = "";
    let categoryTextColor = "";

    if (selectedCategoryId) {
      const BadgeCategory =
        require("../../domain/schema/badgeCategory.schema").default;
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
        // Combined fields - render in a flex container (when NOT using fixed position)
        let combinedHtml = `<div style="display: flex; gap: 8px; align-items: center; margin-top: ${
          props.marginTop || "0mm"
        }; margin-left: ${props.marginLeft || "0mm"}; justify-content: ${
          props.position === "left"
            ? "flex-start"
            : props.position === "center"
            ? "center"
            : "flex-end"
        }; line-height: 1; font-size: 0;">`;

        for (const field of fieldGroup.field) {
          combinedHtml += generateFieldHtml(
            field,
            props,
            fieldDataMap,
            false,
            categoryTextColor,
            true,
            0,
            1,
            0
          );
        }

        combinedHtml += "</div>";
        dynamicContent += combinedHtml;
      } else if (fieldGroup.combined_id && fixedPosition) {
        // Fixed position - render combined fields individually with proper width-based spacing
        const totalFields = fieldGroup.field.length;
        let cumulativeWidth = 0;

        for (let i = 0; i < fieldGroup.field.length; i++) {
          const field = fieldGroup.field[i];
          const fieldWidth = getFieldWidth(field, props, fieldDataMap);

          dynamicContent += generateFieldHtml(
            field,
            props,
            fieldDataMap,
            true,
            categoryTextColor,
            false,
            i,
            totalFields,
            cumulativeWidth
          );

          cumulativeWidth += fieldWidth;
        }
      } else {
        // Single field
        const field = fieldGroup.field?.[0];
        if (field) {
          dynamicContent += generateFieldHtml(
            field,
            props,
            fieldDataMap,
            fixedPosition,
            categoryTextColor,
            false,
            0,
            1,
            0
          );
        }
      }
    }

    // ✅ NEW CODE: Extract and preserve COMPLETE original badgeContent div styles
    const badgeContentMatch = finalHtml.match(
      /<div[^>]*id="badgeContent"[^>]*>([\s\S]*?)<\/div>/
    );

    if (badgeContentMatch) {
      const fullBadgeDiv = badgeContentMatch[0]; // Complete div with all attributes
      const originalContent = badgeContentMatch[1]; // Inner content (may be empty)

      // Extract the full style attribute
      const styleMatch = fullBadgeDiv.match(/style="([^"]*)"/);
      const originalStyles = styleMatch ? styleMatch[1] : "";

      // Parse original styles into a Map
      const styleMap = new Map<string, string>();

      if (originalStyles) {
        originalStyles.split(";").forEach((style: any) => {
          // Use indexOf to avoid breaking URLs with ://
          const colonIndex = style.indexOf(":");
          if (colonIndex === -1) return;

          const key = style.substring(0, colonIndex).trim();
          const value = style.substring(colonIndex + 1).trim();

          if (key && value) {
            styleMap.set(key, value);
          }
        });
      }

      // Add/override ONLY the necessary positioning styles
      // DO NOT override background-image or other visual styles
      styleMap.set("visibility", "visible");
      styleMap.set("position", "relative");
      styleMap.set("width", "100%");
      styleMap.set("box-sizing", "border-box");
      styleMap.set("padding", "0");
      styleMap.set("margin", "0");

      // Only set height if not already present (preserve template height)
      if (!styleMap.has("height")) {
        styleMap.set("height", "100%");
      }

      // Apply category colors if selected (these should override template colors)
      if (categoryBackgroundColor) {
        styleMap.set("background-color", categoryBackgroundColor);
      }
      if (categoryTextColor) {
        styleMap.set("color", categoryTextColor);
      }

      // Build final merged style string
      const mergedStyles = Array.from(styleMap.entries())
        .map(([key, value]) => `${key}: ${value}`)
        .join("; ");

      // Replace ONLY the badgeContent div, preserving ALL original styles + adding dynamic content
      finalHtml = finalHtml.replace(
        /<div[^>]*id="badgeContent"[^>]*>[\s\S]*?<\/div>/,
        `<div id="badgeContent" style="${mergedStyles}">${dynamicContent}</div>`
      );
    } else {
      // Fallback: If no badgeContent div found, create one with basic styles
      finalHtml = finalHtml.replace(
        /<div[^>]*id="badgeContent"[^>]*>[\s\S]*?<\/div>/,
        `<div id="badgeContent" style="visibility: visible; position: relative; width: 100%; height: 100%; box-sizing: border-box; padding: 0; margin: 0;${
          categoryBackgroundColor
            ? ` background-color: ${categoryBackgroundColor};`
            : ""
        }${
          categoryTextColor ? ` color: ${categoryTextColor};` : ""
        }">${dynamicContent}</div>`
      );
    }

    // Inject Google Fonts link for Puppeteer rendering compatibility
    const fontLink = `<link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Momo+Signature&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">`;

    // Ensure the HTML has <head> section, and insert the font link properly
    if (finalHtml.includes("<head>")) {
      finalHtml = finalHtml.replace(
        /<head>/i,
        `<head>\n${fontLink}\n<style>body { font-family: 'Roboto', sans-serif; }</style>\n`
      );
    } else {
      // If no head tag exists, prepend it manually
      finalHtml = `
        <html>
          <head>
            ${fontLink}
            <style>body { font-family: 'Roboto', sans-serif; }</style>
          </head>
          <body>
            ${finalHtml}
          </body>
        </html>
      `;
    }

    // Launch puppeteer and generate PDF
    const browser = await puppeteer.launch({
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
    await page.setContent(finalHtml, { waitUntil: "networkidle0" });
    await page.evaluateHandle("document.fonts.ready");

    // Directly generate PDF buffer
    const pdfUint8Array = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    });

    // Convert Uint8Array → Buffer for compatibility
    const pdfBuffer = Buffer.from(pdfUint8Array);

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.error("❌ Error generating badge PDF:", error);
    throw error;
  }
};

/**
 * API endpoint to generate and download PDF
 */
export const generateFormRegistrationPdf = async (
  req: Request,
  res: Response
) => {
  try {
    const { formRegistrationId } = req.body;

    if (!formRegistrationId) {
      return ErrorResponse(res, "formRegistrationId is required");
    }

    // Generate PDF buffer
    const pdfBuffer = await generateBadgePdf(formRegistrationId);

    if (!pdfBuffer) {
      return ErrorResponse(res, "Failed to generate PDF");
    }

    const fileName = `badge_${formRegistrationId}.pdf`;

    // Send PDF directly as response
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error: any) {
    console.error("❌ Error generating form registration PDF:", error);
    return res.status(500).json({
      status: "error",
      message: "Error generating PDF",
      error: error.message,
    });
  }
};

//////////////////////////////////

// Paper size configurations
const paperSizeConfig: Record<
  string,
  { width: string; height: string; format?: any }
> = {
  a4: { width: "210mm", height: "297mm", format: "A4" },
  a5: { width: "148mm", height: "210mm", format: "A5" },
  a6: { width: "105mm", height: "148mm", format: "A6" },
  letter: { width: "215.9mm", height: "279.4mm", format: "Letter" },
  legal: { width: "215.9mm", height: "355.6mm", format: "Legal" },
};

/**
 * Common function to generate Paper Badge PDF
 */
export const generatePaperBadgePdf = async (
  identifier: string, // Can be formRegistrationId or paperBadgeSettingId
  isPreview: boolean = false
): Promise<Buffer | string | null> => {
  try {
    const baseUrl = env.BASE_URL;

    let registration: any = null;
    let event: any = null;
    let ticket: any = null;
    let paperBadgeSetting: any = null;
    let map_array: Record<string, string> = {};

    if (isPreview) {
      // Preview mode - fetch paper badge setting directly
      paperBadgeSetting = await PaperBadgeSetting.findById(identifier).populate(
        "templateId"
      );

      if (!paperBadgeSetting) {
        throw new Error("Paper Badge setting not found");
      }
    } else {
      // Fetch form registration with populated references for actual data
      registration = await FormRegistration.findById(identifier)
        .populate({
          path: "ticketId",
          populate: { path: "registrationFormId" },
        })
        .populate("eventId")
        .lean();

      if (!registration) {
        throw new Error("Form registration not found");
      }

      ticket = registration.ticketId as any;
      event = registration.eventId as any;

      if (!ticket || !event) {
        throw new Error("Ticket or Event not found");
      }

      // Build map_array from ticket's registration form
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

      // Find paper badge setting for this ticket
      paperBadgeSetting = await PaperBadgeSetting.findOne({
        ticketIds: ticket._id,
        eventId: event._id,
      }).populate("templateId");
    }

    if (!paperBadgeSetting) {
      throw new Error("Paper Badge setting not found");
    }

    // Get paper size configuration
    const paperSize = paperBadgeSetting.paperSize || "a4";
    const paperDimensions = paperSizeConfig[paperSize];

    // Get template if using "withDesign" mode
    const template = paperBadgeSetting.templateId as any;
    const hasTemplate = !!template;

    // Generate or get QR Code based on mode
    let qrCodeBase64 = "";
    if (isPreview) {
      qrCodeBase64 = await QRCode.toDataURL("Sample QR Data", {
        width: 200,
        margin: 1,
      });
    } else {
      // Preview mode - generate sample QR code
      qrCodeBase64 = registration.qrImage
        ? `${baseUrl}/uploads/${registration.qrImage}`
        : await QRCode.toDataURL(
            JSON.stringify({
              event_id: event._id,
              event_slug: event.event_slug,
              formRegistration_id: registration._id,
            }),
            { width: 200, margin: 1 }
          );
    }

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

    // Get form data (only for actual mode)
    const formData = isPreview ? {} : registration.formData || {};

    // Helper function to get field value based on mode
    const getFieldValue = (fieldKey: string): string => {
      if (isPreview) {
        // Preview mode - return placeholder data
        const previewData: Record<string, string> = {
          faceImage: "", // Will show placeholder
          first_name: "First Name",
          last_name: "Last Name",
          email: "Email",
          contact_no: "Contact Number",
          company_name: "Company Name",
          qrCode: qrCodeBase64,
          date: "Select Date",
          badgeCategory: "Badge Category",
          badgeNo: "12345",
        };
        return previewData[fieldKey] || fieldKey;
      }

      // Actual mode - use real data
      // Special handling for specific field types
      if (fieldKey === "qrCode") {
        return qrCodeBase64;
      }

      if (fieldKey === "date") {
        return formatDateTime(event.startDate);
      }

      if (fieldKey === "badgeCategory") {
        return (
          registration.businessData?.category || ticket.ticketCategory || ""
        );
      }

      if (fieldKey === "badgeNo") {
        return registration.badgeNo || "";
      }

      if (fieldKey === "email") {
        return registration.email || formData.email || "";
      }

      if (fieldKey === "faceImage") {
        return registration.faceImageUrl
          ? `${baseUrl}/uploads/participants/${registration.faceImageUrl}`
          : "";
      }

      // For dynamic form fields: Use map_array mapping
      const mappedFieldName = map_array[fieldKey];

      if (mappedFieldName && formData[mappedFieldName]) {
        return formData[mappedFieldName];
      }

      // Fallback: Try direct field access
      if (formData[fieldKey]) {
        return formData[fieldKey];
      }

      return "";
    };

    // ✨ Dynamically build fieldDataMap based on paper badge setting fields
    const fieldDataMap: Record<string, string> = {};

    // Collect all unique field IDs from paper badge settings
    const allFieldIds = new Set<string>();

    for (const fieldGroup of paperBadgeSetting.fields || []) {
      if (fieldGroup.field && Array.isArray(fieldGroup.field)) {
        fieldGroup.field.forEach((field: any) => {
          if (field.id) {
            allFieldIds.add(field.id);
          }
        });
      }
    }

    // Build fieldDataMap for all fields used in paper badge
    allFieldIds.forEach((fieldId) => {
      fieldDataMap[fieldId] = getFieldValue(fieldId);
    });

    // Find badge category if selected (paper badges don't have category color support in schema, but keeping for consistency)
    const badgeCategoryGroup = paperBadgeSetting.fields?.find((f: any) =>
      f.field?.some((field: any) => field.id === "badgeCategory")
    );

    // Safely compute the key to use for indexing fieldProperties to avoid using `undefined` as an index
    const selectedCategoryId = (() => {
      if (!badgeCategoryGroup) return null;
      // support both possible property names used across code (combinedId or combined_id) and fallback to id
      const key =
        badgeCategoryGroup.combined_id ??
        badgeCategoryGroup.combined_id ??
        badgeCategoryGroup.id;
      if (!key) return null;
      return paperBadgeSetting.fieldProperties?.[key]?.categoryId ?? null;
    })();

    // Apply badge category colors if selected
    let categoryBackgroundColor = "";
    let categoryTextColor = "";

    if (selectedCategoryId) {
      const BadgeCategory =
        require("../../domain/schema/badgeCategory.schema").default;
      const category = await BadgeCategory.findById(selectedCategoryId);
      if (category) {
        categoryBackgroundColor = category.backgroundColor;
        categoryTextColor = category.textColor;
      }
    }

    // Build HTML based on design type (with or without template)
    let htmlTemplate = "";

    if (hasTemplate) {
      // With Design - use template
      htmlTemplate = `
        <div style="width: ${paperDimensions.width}; height: ${paperDimensions.height}; margin: 0 auto; background: white; position: relative; overflow: hidden;">
          ${template.htmlContent}
        </div>
      `;
    } else {
      // Without Design - blank canvas
      htmlTemplate = `
        <div style="width: ${paperDimensions.width}; height: ${paperDimensions.height}; margin: 0 auto; background: white; position: relative; overflow: hidden;">
          <div id="badgeContent" style="position: relative; width: 100%; height: 100%;"></div>
        </div>
      `;
    }

    // Build dynamic content based on paper badge settings
    let dynamicContent = "";
    const fixedPosition = paperBadgeSetting.fixedPosition || false;

    for (const fieldGroup of paperBadgeSetting.fields || []) {
      const groupId = fieldGroup.combined_id || fieldGroup.id || "";
      const props = groupId
        ? paperBadgeSetting.fieldProperties?.[groupId] || {}
        : {};

      // Skip badge category field - it only applies colors
      if (fieldGroup.field?.some((f: any) => f.id === "badgeCategory")) {
        continue;
      }

      if (fieldGroup.combined_id && !fixedPosition) {
        // Combined fields - render in a flex container (when NOT using fixed position)
        let combinedHtml = `<div style="display: flex; gap: 8px; align-items: center; margin-top: ${
          props.marginTop || "0mm"
        }; margin-left: ${props.marginLeft || "0mm"}; justify-content: ${
          props.position === "left"
            ? "flex-start"
            : props.position === "center"
            ? "center"
            : "flex-end"
        }; line-height: 1; font-size: 0;">`;

        for (const field of fieldGroup.field) {
          combinedHtml += generateFieldHtml(
            field,
            props,
            fieldDataMap,
            false,
            categoryTextColor,
            true,
            0,
            1,
            0
          );
        }

        combinedHtml += "</div>";
        dynamicContent += combinedHtml;
      } else if (fieldGroup.combined_id && fixedPosition) {
        // Fixed position - render combined fields individually with proper width-based spacing
        const totalFields = fieldGroup.field.length;
        let cumulativeWidth = 0;

        for (let i = 0; i < fieldGroup.field.length; i++) {
          const field = fieldGroup.field[i];
          const fieldWidth = getFieldWidth(
            field,
            props,
            fieldDataMap,
            isPreview
          );

          dynamicContent += generateFieldHtml(
            field,
            props,
            fieldDataMap,
            true,
            categoryTextColor,
            false,
            i,
            totalFields,
            cumulativeWidth
          );

          cumulativeWidth += fieldWidth;
        }
      } else {
        // Single field
        const field = fieldGroup.field?.[0];
        if (field) {
          dynamicContent += generateFieldHtml(
            field,
            props,
            fieldDataMap,
            fixedPosition,
            categoryTextColor,
            false,
            0,
            1,
            0
          );
        }
      }
    }

    let finalHtml = htmlTemplate;

    // ✅ Extract and preserve COMPLETE original badgeContent div
    const badgeContentMatch = finalHtml.match(
      /<div[^>]*id="badgeContent"[^>]*>([\s\S]*?)<\/div>/
    );

    if (badgeContentMatch) {
      const fullBadgeDiv = badgeContentMatch[0]; // Complete div with all attributes
      const originalContent = badgeContentMatch[1]; // Inner content (may be empty)

      // Extract the full style attribute
      const styleMatch = fullBadgeDiv.match(/style="([^"]*)"/);
      const originalStyles = styleMatch ? styleMatch[1] : "";

      // Parse original styles into a Map
      const styleMap = new Map<string, string>();

      if (originalStyles) {
        originalStyles.split(";").forEach((style) => {
          // Use indexOf to avoid breaking URLs with ://
          const colonIndex = style.indexOf(":");
          if (colonIndex === -1) return;

          const key = style.substring(0, colonIndex).trim();
          const value = style.substring(colonIndex + 1).trim();

          if (key && value) {
            styleMap.set(key, value);
          }
        });
      }

      // Add/override ONLY the necessary positioning styles
      // DO NOT override background-image or other visual styles
      styleMap.set("visibility", "visible");
      styleMap.set("position", "relative");
      styleMap.set("width", "100%");
      styleMap.set("box-sizing", "border-box");
      styleMap.set("padding", "0");
      styleMap.set("margin", "0");

      // Only set height if not already present (preserve template height)
      if (!styleMap.has("height")) {
        styleMap.set("height", "100%");
      }

      // Apply category colors if selected (these should override template colors)
      if (categoryBackgroundColor) {
        styleMap.set("background-color", categoryBackgroundColor);
      }
      if (categoryTextColor) {
        styleMap.set("color", categoryTextColor);
      }

      // Build final merged style string
      const mergedStyles = Array.from(styleMap.entries())
        .map(([key, value]) => `${key}: ${value}`)
        .join("; ");

      // Replace ONLY the badgeContent div, preserving ALL original styles + adding dynamic content
      finalHtml = finalHtml.replace(
        /<div[^>]*id="badgeContent"[^>]*>[\s\S]*?<\/div>/,
        `<div id="badgeContent" style="${mergedStyles}">${dynamicContent}</div>`
      );
    } else if (hasTemplate) {
      // If template exists but has no badgeContent div, append dynamic content
      finalHtml = htmlTemplate.replace(
        /<\/div>\s*$/,
        `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 5mm;">${dynamicContent}</div></div>`
      );
    }

    // If template exists but has no badgeContent div, append dynamic content
    if (hasTemplate && !htmlTemplate.includes('id="badgeContent"')) {
      finalHtml = htmlTemplate.replace(
        /<\/div>\s*$/,
        `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 5mm;">${dynamicContent}</div></div>`
      );
    }

    // Wrap in complete HTML document with print-optimized styles
    finalHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet"> 
        <title>Print Badge - ${paperDimensions.width} x ${paperDimensions.height}</title>
        <style>
          @page {
            size: ${paperDimensions.width} ${paperDimensions.height};
            margin: 0;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
          
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: Roboto, sans-serif;
          }
          
          .print-container {
            width: ${paperDimensions.width};
            height: ${paperDimensions.height};
            position: relative;
            page-break-after: always;
          }
          
          /* Ensure images print correctly */
          img {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            max-width: 100%;
            height: auto;
          }
          
          /* Ensure backgrounds print */
          div, span, section, article {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          @media print {
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
            }
            
            .print-container {
              margin: 0;
              padding: 0;
              border: none !important;
              box-shadow: none !important;
            }
            
            /* Hide any border that might show in preview */
            * {
              box-shadow: none !important;
            }
          }
          
          @media screen {
            body {
              background: #f5f5f5;
            }
            
            .print-container {
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">

          ${finalHtml}
        </div>
      </body>
      </html>
    `;

    // Inject Google Fonts link for Puppeteer rendering
    const fontLink = `<link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Momo+Signature&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">`;

    // If the <head> already exists, add the font link there
    if (finalHtml.includes("<head>")) {
      finalHtml = finalHtml.replace(
        /<head>/i,
        `<head>\n${fontLink}\n<style>body { font-family: 'Roboto', sans-serif; }</style>\n`
      );
    } else {
      // Otherwise, wrap the content in a proper HTML structure
      finalHtml = `
        <html>
          <head>
            ${fontLink}
            <style>body { font-family: 'Roboto', sans-serif; }</style>
          </head>
          <body>
            ${finalHtml}
          </body>
        </html>
      `;
    }

    // Launch puppeteer and generate PDF
    const browser = await puppeteer.launch({
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
    await page.setContent(finalHtml, { waitUntil: "networkidle0" });
    await page.evaluateHandle("document.fonts.ready");
    const pdfOptions: any = {
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    };

    // Use format if available, otherwise use custom dimensions
    if (paperDimensions.format) {
      pdfOptions.format = paperDimensions.format;
    } else {
      pdfOptions.width = paperDimensions.width;
      pdfOptions.height = paperDimensions.height;
    }

    const pdfUint8 = await page.pdf(pdfOptions);
    const pdfBuffer = Buffer.from(pdfUint8);

    await browser.close();

    return pdfBuffer;
  } catch (error: any) {
    console.error("❌ Error generating paper badge PDF:", error);
    throw error;
  }
};

/**
 * API endpoint to generate and download Paper Badge PDF
 */
export const generatePaperBadgePdfEndpoint = async (
  req: Request,
  res: Response
) => {
  try {
    const { formRegistrationId } = req.body;

    if (!formRegistrationId) {
      return ErrorResponse(res, "formRegistrationId is required");
    }

    const pdfBuffer = await generatePaperBadgePdf(formRegistrationId, false);

    if (!pdfBuffer) {
      return ErrorResponse(res, "Failed to generate PDF");
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="paper_badge_${Date.now()}.pdf"`,
    });

    // Send PDF directly in response
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error("❌ Error generating paper badge PDF:", error);
    return res.status(500).json({
      status: "error",
      message: "Error generating PDF",
      error: error.message,
    });
  }
};

/**
 * API endpoint for Paper Badge Preview PDF
 */
export const getPaperBadgePreviewPdf = async (req: Request, res: Response) => {
  try {
    const { id: settingId } = req.params;

    if (!settingId) {
      return ErrorResponse(res, "Setting ID is required");
    }

    const pdfBuffer = await generatePaperBadgePdf(settingId, true);

    if (!pdfBuffer) {
      return ErrorResponse(res, "Failed to generate preview PDF");
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="paper_badge_preview_${Date.now()}.pdf"`,
    });

    res.send(pdfBuffer);
  } catch (error: any) {
    console.error("Error:", error);
    return ErrorResponse(res, error.message || "Error generating preview PDF");
  }
};

export const getFormRegistrationListController = async (
  req: Request,
  res: Response
) => {
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
      endDate = "", // Add this line
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
      endDate as string, // Add this line

      (error, result) => {
        if (error) {
          return ErrorResponse(res, error.message);
        }
        // Append BASE_URL to all image/file fields
        if (result?.registrations?.length) {
          result.data = result.registrations.map((r: any) =>
            appendBaseUrlToFiles(r)
          );
        }

        return successResponse(
          res,
          "Form registrations retrieved successfully",
          result
        );
      }
    );
  } catch (error) {
    console.error(error);
    return ErrorResponse(
      res,
      "An error occurred while fetching form registrations."
    );
  }
};

export const updateFormRegistrationStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    if (typeof approved !== "boolean") {
      return ErrorResponse(
        res,
        "Approved status must be boolean (true/false)."
      );
    }

    updateFormRegistrationStatusModel(id, approved, (error, result) => {
      if (error) return ErrorResponse(res, error.message);
      return successResponse(
        res,
        "Registration status updated successfully",
        result
      );
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
    return ErrorResponse(
      res,
      "An error occurred while updating registration.",
      {
        errorType: "INTERNAL_SERVER_ERROR",
      }
    );
  }
};

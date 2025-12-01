import { loggerMsg } from "../../lib/logger";
import ticketSchema from "../schema/ticket.schema";
import userTypeSchema from "../schema/userType.schema";
import {
  generateBadgeNumber,
  processFaceImage,
  processFaceImageBase64,
  saveQrImage,
} from "./formRegistration.model";
import path from "path";
import fs from "fs";
import QRCode from "qrcode";
import formRegistrationSchema from "../schema/formRegistration.schema";
import { v4 as uuidv4 } from "uuid";
import { generateBadgePdf } from "../../interface/controllers/formRegistration.controller";

const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;

export const instantRegisteredFormRegistrationModel = async (
  registerData: any,
  files: Express.Multer.File[],
  callback: (error: any, result: any) => void
) => {
  try {
    const { event_id, name, contact_no } = registerData;
    const Attendees: any = await userTypeSchema
      .findOne({ typeName: "Event Attendees" })
      .sort({ order: 1 })
      .lean();
    const ticket: any = await ticketSchema
      .findOne({
        eventId: event_id,
        userType: Attendees?._id,
      })
      .populate("registrationFormId")
      .populate("eventId");

    const nameField = ticket?.registrationFormId?.pages
      ?.flatMap((page: any) => page.elements)
      ?.find((el: any) => el.mapField === "first_name").fieldName;

    const contactField = ticket?.registrationFormId?.pages
      ?.flatMap((page: any) => page.elements)
      ?.find((el: any) => el.mapField === "contact_no").fieldName;

    // Check if user with same contact_no already exists
    const existingUser = await formRegistrationSchema
      .findOne({
        eventId: event_id,
        [`formData.${contactField}`]: contact_no,
      })
      .lean();
    if (existingUser) {
      const error = new Error(
        "User already registered with this contact number"
      );
      return callback(error, null);
    }
    const forData: any = {};
    forData[nameField] = name;
    forData[contactField] = contact_no;
    // Process face scan if provided
    let faceId = "";
    let faceImageUrl: any = "";
    let uploadedImageBuffer: any = null;

    // Check for face scan in files or base64
    const faceScanFile = files?.find((file) => file.fieldname === "faceScan");
    if (faceScanFile) {
      try {
        const processedFaceData = await processFaceImage(faceScanFile);
        faceId = processedFaceData.faceId;
        faceImageUrl = processedFaceData.imageKey;
        uploadedImageBuffer = processedFaceData.imageBuffer;
      } catch (faceError) {
        console.error("❌ Face processing failed:", faceError);
        return callback(
          {
            // message: `Face processing failed: ${
            //   faceError instanceof Error ? faceError.message : "Unknown error"
            // }`,
            message: "Face processing failed",
            errorType: "FACE_PROCESSING_ERROR",
          },
          null
        );
      }
    } else if (
      registerData.faceScan &&
      typeof registerData.faceScan === "string" &&
      registerData.faceScan.startsWith("data:image/")
    ) {
      try {
        const processedFaceData = await processFaceImageBase64(
          registerData.faceScan
        );
        faceId = processedFaceData.faceId;
        faceImageUrl = processedFaceData.imageKey;
        uploadedImageBuffer = processedFaceData.imageBuffer;
        // Remove base64 from form data to avoid storing large strings
        delete registerData.faceScan;
      } catch (faceError) {
        console.error("❌ Face processing failed:", faceError);
        return callback(
          {
            // message: `Face processing failed: ${
            //   faceError instanceof Error ? faceError.message : "Unknown error"
            // }`,
            message: "Face processing failed",
            errorType: "FACE_PROCESSING_ERROR",
          },
          null
        );
      }
    }
    const filesByField: { [key: string]: Express.Multer.File[] } = {};

    files?.forEach((file) => {
      if (file.fieldname !== "faceScan") {
        if (!filesByField[file.fieldname]) filesByField[file.fieldname] = [];
        filesByField[file.fieldname].push(file);
      }
    });

    const savePath = path.join("uploads/participants", faceImageUrl);
    const dir = path.dirname(savePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (uploadedImageBuffer) {
      fs.writeFileSync(savePath, uploadedImageBuffer);
    }
    const userToken = uuidv4();
    const finalBadgeNo = await generateBadgeNumber(ticket);
    let registrationData: any = {
      formData: forData,
      approved: true,
      instantRegistered: true,
      badgeNumber: finalBadgeNo,
      eventId: event_id,
      ticketId: ticket?._id,
      status: "in",
      checkin_time: new Date(),
    };
    if (faceId) {
      registrationData.faceId = faceId;
    }

    if (faceImageUrl) {
      registrationData.faceImageUrl = faceImageUrl;
    }
    const registration = new formRegistrationSchema(registrationData);
    await registration.save();
    const baseUrl = process.env.BASE_URL;
    let qrCodeBase64 = null;
    let qrFileName = null;
    if (ticket && ticket.eventId) {
      const qrData = JSON.stringify({
        event_id: ticket.eventId._id,
        event_slug: ticket.eventId.event_slug,
        formRegistration_id: registration._id,
      });
      qrCodeBase64 = await QRCode.toDataURL(qrData);
      qrFileName = saveQrImage(qrCodeBase64, userToken);
      registration.qrImage = `${qrFileName}`;
      await registration.save();
    }
    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await generateBadgePdf(registration.id.toString());
    } catch (pdfError) {
      console.error("Failed to generate PDF badge:", pdfError);
    }
    const responseData: any = {
      registrationId: registration._id,
      badgeNo: finalBadgeNo,
      userData: { name: name, contact_no: contact_no },
      scannerData: {
        status: "in",
        color_status: "green",
        scanning_msg: "Welcome! You are now checked in.",
      },
    };
    if (faceId) {
      responseData.faceId = faceId;
    }

    if (faceImageUrl) {
      responseData.faceImageUrl =
        baseUrl + "/uploads/participants/" + `${faceImageUrl}`;
    }
    // Add QR code to response if generated
    if (qrCodeBase64) {
      responseData.qrCode = qrCodeBase64;
      responseData.qrImageUrl = baseUrl + "/uploads/" + qrFileName;
    }

    return callback(null, responseData);
  } catch (error: any) {
    loggerMsg("Error in instantRegisteredFormRegistrationModel", error);
    callback(error, null);
  }
};

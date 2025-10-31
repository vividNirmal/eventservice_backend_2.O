import { Request, Response } from "express";
import {
  successCreated,
  successResponse,
  ErrorResponse,
  errorResponseWithData,
} from "../../helper/apiResponse";
import {
  loginOtpGenerateModel,
  storeParticipantUser,
  updateParticipantUserModel,
  verifyOtpModel,
} from "../../domain/models/participantUser.model";
import participantUsers from "../../domain/schema/participantUsers.schema";
import eventParticipant from "../../domain/schema/eventParticipant";
import eventSchema from "../../domain/schema/event.schema";
import eventHostSchema from "../../domain/schema/eventHost.schema";
import { env } from "process";
import multer from "multer";
import fs from "fs";
import { cryptoService } from "../../services/cryptoService";
import { detectFace } from "../../services/rekognitionService";
import puppeteer from "puppeteer";
import FormRegistration from "../../domain/schema/formRegistration.schema";
import path from "path";
import QRCode from "qrcode";
import {
  RekognitionClient,
  IndexFacesCommand,
  CreateCollectionCommand,
  SearchFacesByImageCommand,
  CompareFacesCommand,
  CompareFacesResponse,
} from "@aws-sdk/client-rekognition";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import ticketSchema from "../../domain/schema/ticket.schema";

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const ss3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  endpoint: `https://s3.${process.env.AWS_REGION}.amazonaws.com`,
  forcePathStyle: true,
});

const FACE_COLLECTION_ID = process.env.AWS_REKOGNITION_COLLECTION;
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;

interface FileWithBuffer extends Express.Multer.File {
  buffer: Buffer;
}

const upload = multer();

export const scanParticipantFace = async (req: Request, res: Response) => {
  // Helper to get timestamp
  const getTimestamp = () => new Date().toISOString();
  // Store timestamps for each major process
  const processTimestamps: any = {};

  try {
    processTimestamps["start"] = getTimestamp();

    const baseUrl = env.BASE_URL;
    const eventId = req.body.event_id;
    const scanner_type = req.body.scanner_type;
    var user_image_date = "";

    processTimestamps["file_upload_check_start"] = getTimestamp();
    const file = (req.files as Express.Multer.File[])[0];
    if (!file) {
      processTimestamps["file_upload_check_end"] = getTimestamp();
      return res
        .status(400)
        .json({ error: "No file uploaded", processTimestamps });
    }
    processTimestamps["file_upload_check_end"] = getTimestamp();

    processTimestamps["file_type_size_check_start"] = getTimestamp();
    const allowedMimeTypes = ["image/png", "image/jpeg"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      processTimestamps["file_type_size_check_end"] = getTimestamp();
      return ErrorResponse(res, "Only PNG and JPG files are allowed");
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      processTimestamps["file_type_size_check_end"] = getTimestamp();
      return ErrorResponse(res, "File size must be less than 5MB");
    }
    processTimestamps["file_type_size_check_end"] = getTimestamp();

    processTimestamps["image_compression_start"] = getTimestamp();
    const imageBuffer = file.buffer;
    const compressedImageBuffer = await sharp(imageBuffer)
      .resize(100)
      .jpeg({ quality: 100 })
      .toBuffer();
    processTimestamps["image_compression_end"] = getTimestamp();

    processTimestamps["participant_fetch_start"] = getTimestamp();

    // First check if event exists in eventHost schema (most likely)
    let eventDetails = await eventHostSchema.findById(eventId);
    if (!eventDetails) {
      // Fallback to event schema if not found in eventHost
      eventDetails = await eventSchema.findById(eventId);
    }

    if (!eventDetails) {
      return ErrorResponse(res, "Event not found");
    }
    let participants: any = await FormRegistration.find({
      eventId: eventId,
    }).lean();

    processTimestamps["participant_fetch_end"] = getTimestamp();

    if (!participants.length) {
      return ErrorResponse(res, "No participants found for this event");
    }
    processTimestamps["face_compare_start"] = getTimestamp();

    const participantsWithImages = participants.filter(
      (p: any) => p.faceImageUrl && p.faceImageUrl.trim() !== ""
    );

    if (participantsWithImages.length === 0) {
      return ErrorResponse(res, "No face images found for comparison");
    }

    const comparePromises = participantsWithImages.map(
      async (participant: any) => {
        const imageKey = participant.faceImageUrl;
        try {
          const compareCommand = new CompareFacesCommand({
            SourceImage: { Bytes: compressedImageBuffer },
            TargetImage: {
              S3Object: {
                Bucket: AWS_BUCKET_NAME,
                Name: imageKey,
              },
            },
            SimilarityThreshold: 70,
          });

          const compareResult = await rekognition.send(compareCommand);
          if (
            compareResult.FaceMatches &&
            compareResult.FaceMatches.length > 0
          ) {
            const similarity = compareResult.FaceMatches[0].Similarity;

            user_image_date =
              baseUrl + "/uploads/participants/" + participant.faceImageUrl;
            return participant;
          }
          return null;
        } catch (error) {
          console.error("❌ Error during face comparison:", error);
          console.error(
            `❌ Error comparing faces for participant ${participant.email}:`,
            error
          );
          return null;
        }
      }
    );

    const results = await Promise.all(comparePromises);
    processTimestamps["face_compare_end"] = getTimestamp();

    const matchedParticipant = results.find((r) => r !== null);

    if (matchedParticipant) {
      processTimestamps["participant_details_fetch_start"] = getTimestamp();
      const participant_details = await FormRegistration.findOne({
        _id: matchedParticipant._id,
      });
      processTimestamps["participant_details_fetch_end"] = getTimestamp();

      if (!participant_details) {
        return ErrorResponse(res, "Participant User Not Found");
      }
      // Check if participant is blocked
      const isBlocked = participant_details.approved;

      var color_status = "";
      var scanning_msg = "";

      processTimestamps["event_participant_event_fetch_start"] = getTimestamp();

      // Use the eventDetails we already found instead of searching again
      processTimestamps["event_participant_event_fetch_end"] = getTimestamp();

      if (!eventDetails) {
        return ErrorResponse(res, "Event Details Not Found");
      }

      processTimestamps["status_update_start"] = getTimestamp();

      // Skip check-in/check-out if participant is blocked
      if (!isBlocked) {
        console.log(
          "🚫 Participant is  blocked - skipping check-in/check-out process"
        );
        scanning_msg = "Participant is blocked from this event";
        color_status = "red";
      } else {
        // Original check-in/check-out logic for non-blocked participants
        if (scanner_type == 0) {
          if (participant_details.status == "in") {
            scanning_msg = "You are already in the event";
            color_status = "yellow";
          } else {
            participant_details.checkin_time = new Date();
            participant_details.status = "in";

            try {
              await FormRegistration.updateOne(
                { _id: participant_details._id },
                {
                  $set: {
                    checkin_time: participant_details.checkin_time,
                    status: participant_details.status,
                  },
                }
              );
            } catch (saveError) {
              console.error(
                "❌ Error saving event participant details:",
                saveError
              );
              return ErrorResponse(res, "Failed to update participant status");
            }

            scanning_msg = "We welcome you";
            color_status = "green";
          }
        }

        if (scanner_type == 1) {
          if (participant_details.status != "in") {
            scanning_msg = "You can't check out without checking in";
            color_status = "red";
          } else {
            participant_details.checkout_time = new Date();
            participant_details.status = "out";

            try {
              await FormRegistration.updateOne(
                { _id: participant_details._id },
                {
                  $set: {
                    checkin_time: participant_details.checkin_time,
                    status: participant_details.status,
                  },
                }
              );
            } catch (saveError) {
              console.error(
                "❌ Error saving event participant details:",
                saveError
              );
              return ErrorResponse(res, "Failed to update participant status");
            }

            scanning_msg = "You are now checked out from the event";
            color_status = "green";
          }
        }
      }
      processTimestamps["status_update_end"] = getTimestamp();
      participant_details.faceImageUrl =
        baseUrl + "/uploads/participants/" + participant_details.faceImageUrl;
      participant_details.qrImage =
        baseUrl + "/uploads/" + participant_details.qrImage;

      const resutl = [];

      // Handle both eventHost and event schema fields
      if (eventDetails.event_logo) {
        eventDetails.event_logo = `${env.BASE_URL}/${eventDetails.event_logo}`;
      }
      if (eventDetails.event_image) {
        eventDetails.event_image = `${env.BASE_URL}/${eventDetails.event_image}`;
      }

      const map_array: any = {};
      const ticket: any = await ticketSchema
        .findOne({ _id: participant_details?.ticketId })
        .populate("registrationFormId")
        .lean();
      const forms_registration = ticket?.registrationFormId;
      const pages = forms_registration?.pages;
      if (pages) {
        pages.forEach((page: any) => {
          page.elements?.forEach((element: any) => {
            if (element.mapField) {
              map_array[element.mapField] = element.fieldName;
            }
          });
        });
      }

      resutl.push(eventDetails);
      // resutl.push({ ...participant_details.toObject(), map_array });

      // Include blockStatus in participant details for face scanner
      const participantWithBlockStatus = {
        ...participant_details.toObject(),
        blockStatus: participant_details.approved || false,
        map_array
      };
      
        resutl.push(participantWithBlockStatus);
      

      resutl.push({ user_image: user_image_date });
      resutl.push({ color_status: color_status, scanning_msg: scanning_msg });
      resutl.push({ processTimestamps }); // Add timestamps to response
      return successResponse(res, "Participant User Details", resutl);
    } else {
      let result = [];
      const color_status = "red";
      const scanning_msg = "You have not registered yet!";
      result.push({ color_status: color_status, scanning_msg: scanning_msg });
      return errorResponseWithData(res, "You have not registered yet!", result);
    }
  } catch (error) { processTimestamps["error"] = getTimestamp();
    return ErrorResponse(res, "Face recognition failed");
  }
};

export const scanParticipantQR = async (req: Request, res: Response) => {
  const processTimestamps: any = {};
  const getTimestamp = () => new Date().toISOString();

  try {
    processTimestamps["start"] = getTimestamp();

    const { scanner_type, qrValue } = req.body;
    if (!qrValue) return ErrorResponse(res, "QR code value is required");

    // 🧩 Step 1: Parse QR code JSON
    let qrData;
    try {
      qrData = typeof qrValue === "string" ? JSON.parse(qrValue) : qrValue;
    } catch {
      return ErrorResponse(res, "Invalid QR code format (must be JSON)");
    }

    const event_id = qrData.event_id;
    const formRegistrationId = qrData.formRegistration_id;
    let participant: any = await FormRegistration.findById(
      formRegistrationId
    ).lean();
    const map_array: any = {};
    const ticket: any = await ticketSchema
      .findOne({ _id: participant?.ticketId })
      .populate("registrationFormId")
      .lean();
    const forms_registration = ticket?.registrationFormId;
    const pages = forms_registration?.pages;
    if (pages) {
      pages.forEach((page: any) => {
        page.elements?.forEach((element: any) => {
          if (element.mapField) {
            map_array[element.mapField] = element.fieldName;
          }
        });
      });
    }
    participant = { ...participant, map_array };

    if (!event_id || !formRegistrationId)
      return ErrorResponse(
        res,
        "Invalid QR data — missing event or participant ID"
      );

    // 🧩 Step 2: Fetch event details
    processTimestamps["event_fetch_start"] = getTimestamp();
    let eventDetails = await eventHostSchema.findById(event_id);
    if (!eventDetails) eventDetails = await eventSchema.findById(event_id);
    processTimestamps["event_fetch_end"] = getTimestamp();

    if (!eventDetails) return ErrorResponse(res, "Event not found");

    // 🧩 Step 3: Fetch participant
    processTimestamps["participant_lookup_start"] = getTimestamp();

    processTimestamps["participant_lookup_end"] = getTimestamp();

    if (!participant) {
      const result = [{ color_status: "red", scanning_msg: "Invalid QR code" }];
      return errorResponseWithData(
        res,
        "No participant found for this QR",
        result
      );
    }

    // 🧩 Step 4: Validate approval and handle check-in/out
    let color_status = "";
    let scanning_msg = "";

    if (!participant.approved) {
      scanning_msg = "Participant is blocked from this event";
      color_status = "red";
    } else {
      if (scanner_type == 0) {
        // ✅ Check-in
        if (participant.status === "in") {
          scanning_msg = "Already checked in";
          color_status = "yellow";
        } else {
          participant.status = "in";
          participant.checkin_time = new Date();
          await participant.save();
          scanning_msg = "Welcome! You are now checked in.";
          color_status = "green";
        }
      } else if (scanner_type == 1) {
        // ✅ Check-out
        if (participant.status !== "in") {
          scanning_msg = "You can't check out without checking in first";
          color_status = "red";
        } else {
          participant.status = "out";
          participant.checkout_time = new Date();
          await participant.save();
          scanning_msg = "You are now checked out from the event.";
          color_status = "green";
        }
      }
    }

    // 🧩 Step 5: Add image URLs and response formatting
    const baseUrl = env.BASE_URL;
    if (participant.faceImageUrl)
      participant.faceImageUrl = `${baseUrl}/uploads/participants/${participant.faceImageUrl}`;
    if (participant.qrImage)
      participant.qrImage = `${baseUrl}/uploads/${participant.qrImage}`;
    if (eventDetails.event_logo)
      eventDetails.event_logo = `${baseUrl}/${eventDetails.event_logo}`;
    if (eventDetails.event_image)
      eventDetails.event_image = `${baseUrl}/${eventDetails.event_image}`;

    const result = [
      eventDetails,
      participant,
      { color_status, scanning_msg, processTimestamps },
    ];

    return successResponse(res, "Participant QR Scan Successful", result);
  } catch (error) {
    processTimestamps["error"] = getTimestamp();
    console.error("❌ Error in scanParticipantQR:", error);
    return ErrorResponse(res, "QR scanning failed");
  }
};

export const scanFaceId = async (req: Request, res: Response) => {
  try {
    req.file = req.file as FileWithBuffer;

    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const faceId = await detectFace(req.file.buffer);
  } catch (error) {}
};

export const storeEventParticipantUser = async (
  req: Request,
  res: Response
) => {
  try {
    let uploadedImage = "";
    let faceId = "";

    // Check for file in req.files or base64 in dynamic_form_data
    let imageBuffer: Buffer | null = null;
    let fileMimeType: string | null = null;

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const file = req.files[0];

      const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return ErrorResponse(res, "Only PNG and JPG files are allowed");
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return ErrorResponse(res, "File size must be less than 5MB");
      }

      imageBuffer = await sharp(file.buffer)
        .resize(100)
        .jpeg({ quality: 100 })
        .toBuffer();
      fileMimeType = file.mimetype;
    } else if (req.body.dynamic_form_data) {
      // Handle base64 image in dynamic_form_data
      let dynamicFormData;
      try {
        dynamicFormData =
          typeof req.body.dynamic_form_data === "string"
            ? JSON.parse(req.body.dynamic_form_data)
            : req.body.dynamic_form_data;
      } catch (error) {
        console.error("Error parsing dynamic_form_data:", error);
        return ErrorResponse(res, "Invalid dynamic form data");
      }

      const base64Image = dynamicFormData?.face_image?.image;
      if (
        base64Image &&
        typeof base64Image === "string" &&
        base64Image.startsWith("data:image/")
      ) {
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
        try {
          imageBuffer = Buffer.from(base64Data, "base64");
          fileMimeType = base64Image.split(";")[0].split(":")[1]; // e.g., image/jpeg
        } catch (error) {
          console.error("Error decoding base64 image:", error);
          return ErrorResponse(res, "Invalid base64 image data");
        }

        const allowedMimeTypes = ["image/png", "image/jpeg"];
        if (!allowedMimeTypes.includes(fileMimeType)) {
          return ErrorResponse(
            res,
            "Only PNG and JPG base64 images are allowed"
          );
        }

        const maxSize = 5 * 1024 * 1024;
        if (imageBuffer.length > maxSize) {
          return ErrorResponse(res, "Base64 image size must be less than 5MB");
        }

        imageBuffer = await sharp(imageBuffer)
          .resize(100)
          .jpeg({ quality: 100 })
          .toBuffer();
      }
    }

    if (imageBuffer && fileMimeType) {
      try {
        // Ensure Rekognition collection exists
        await rekognition
          .send(
            new CreateCollectionCommand({
              CollectionId: FACE_COLLECTION_ID,
            })
          )
          .catch((err) =>
            console.error("Collection already exists or error:", err)
          );

        const fileKey = `${uuidv4()}.jpg`;

        // Upload image to S3
        await ss3.send(
          new PutObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            Key: fileKey,
            Body: imageBuffer,
            ContentType: fileMimeType,
          })
        );

        // Index face in Rekognition
        const indexCommand = new IndexFacesCommand({
          CollectionId: FACE_COLLECTION_ID,
          Image: { Bytes: imageBuffer },
          ExternalImageId: fileKey,
          DetectionAttributes: ["DEFAULT"],
        });

        const indexResult = await rekognition.send(indexCommand);

        if (!indexResult.FaceRecords || indexResult.FaceRecords.length === 0) {
          return ErrorResponse(res, "No valid face detected in the image");
        }

        faceId = indexResult.FaceRecords[0].Face?.FaceId || "";
        uploadedImage = fileKey;

        // Save locally (optional, consider removing if S3 is primary storage)
        const savePath = path.join("uploads/participants", fileKey);
        const dir = path.dirname(savePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(savePath, imageBuffer);

        // Attach image URL and face ID to request body
        req.body.image_url = fileKey;
        req.body.face_id = faceId;
      } catch (error) {
        console.error("Error processing image:", error);
        return ErrorResponse(
          res,
          `Image upload and face recognition failed1: ${error}`
        );
      }
    } else {
      console.warn("⚠️ No face image provided in files or dynamic_form_data");
    }

    storeParticipantUser(req.body, (error: any, result: any) => {
      if (error) {
        return res.status(500).json({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred.",
        });
      }
      return successCreated(res, result);
    });
  } catch (error) {
    console.error("Error in storeEventParticipantUser:", error);
    return ErrorResponse(res, "Failed to store participant");
  }
};

export const getUserDetailsUsingEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required.",
      });
    }

    const user = await participantUsers.findOne({
      $or: [
        { "dynamic_fields.email": email },
        { "dynamic_fields.email_address": email },
      ],
    });
    const face_scanner = true;
    if (!user) {
      const user = null;
      return successResponse(res, "Get Participant User List", {
        face_scanner,
        user,
      });
    }

    return successResponse(res, "Get Participant User List", {
      face_scanner,
      user,
    });
  } catch (error) {}
};

const formatDate = (
  dateString: string
): { day: number; month: string; year: number } => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const date = new Date(dateString);
  return {
    day: date.getDate(),
    month: months[date.getMonth()],
    year: date.getFullYear(),
  };
};

export const generateScannerEventPdf = async (req: Request, res: Response) => {
  try {
    const baseUrl = env.BASE_URL;
    const key = env.ENCRYPT_KEY;
    const iv = env.DECRYPT_KEY;
    const { event_slug, user_token } = req.body;
    // const event_slug = "test-event-slug";
    const token = user_token;
    const event_participant_details = await eventParticipant.findOne({ token });
    if (!event_participant_details) {
      return ErrorResponse(res, "Participant details not found");
    }
    const event_details = await eventHostSchema.findOne({
      _id: event_participant_details.event_id,
    });
    // const event_details = await eventSchema.findOne({ event_slug: event_slug });
    if (event_details?.event_logo) {
      event_details.event_logo = baseUrl + "/" + event_details.event_logo;
    }

    if (event_details?.event_image) {
      event_details.event_image = baseUrl + "/" + event_details.event_image;
    }

    if (event_details?.show_location_image) {
      event_details.show_location_image =
        baseUrl + "/" + event_details.show_location_image;
    }
    const participant_details = await participantUsers.findOne({
      _id: event_participant_details.participant_user_id,
    });

    if (!participant_details) {
      return ErrorResponse(res, "Participant User not found");
    }

    // const startDates: string[] = event_details?.start_date || [];
    // const endDates: string[] = event_details?.end_date || [];
    // const getEarliestDate = (dates: string[]): Date => {
    //   return new Date(
    //     dates.reduce((min, date) =>
    //       new Date(date) < new Date(min) ? date : min
    //     )
    //   );
    // };

    // // Function to find the latest (maximum) date
    // const getLatestDate = (dates: string[]): Date => {
    //   return new Date(
    //     dates.reduce((max, date) =>
    //       new Date(date) > new Date(max) ? date : max
    //     )
    //   );
    // };

    // // Get earliest start date and latest end date
    // const earliestStartDate = getEarliestDate(startDates);
    // const latestEndDate = getLatestDate(endDates);
    // Function to format date with time
    const formatDateTime = (date?: Date | string): string => {
      if (!date) {
        return "N/A"; // Return a default value if date is undefined
      }
      const dateObj = typeof date === "string" ? new Date(date) : date;
      const day = dateObj.getDate();
      const month = dateObj.toLocaleString("default", { month: "long" });
      const year = dateObj.getFullYear();
      const time = dateObj.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return `${day} ${month} ${year} - ${time}`;
    };

    // Extracting values
    // const earliestStartDay = earliestStartDate.getDate();
    // const latestEndDay = latestEndDate.getDate();
    // const latestEndMonth = latestEndDate.toLocaleString("default", {
    //   month: "long",
    // });
    // const startTime = earliestStartDate.toLocaleTimeString([], {
    //   hour: "2-digit",
    //   minute: "2-digit",
    //   hour12: true,
    // });
    // const endTime = latestEndDate.toLocaleTimeString([], {
    //   hour: "2-digit",
    //   minute: "2-digit",
    //   hour12: true,
    // });

    // Final formatted output
    //const formattedDateRange = `${earliestStartDay} - ${latestEndDay} ${latestEndMonth} ${latestEndDate.getFullYear()} - ${startTime} to ${endTime}`;
    const formattedDateRange = `${formatDateTime(
      event_details?.startDate
    )} to ${formatDateTime(event_details?.endDate)}`;
    const participant_qr_details = JSON.stringify({
      user_token: user_token,
      event_id: event_details?.id,
      event_slug: event_details?.event_slug,
    });
    const base64Image = await QRCode.toDataURL(participant_qr_details);

    const filterDates: string[] = [];

    // startDates.forEach((startDate, index) => {
    //   const endDate = endDates[index] || null;

    //   if (startDate) {
    //     const start = new Date(startDate);
    //     const end = endDate ? new Date(endDate) : null;

    //     const formattedDate = `${start.toLocaleDateString("en-US", {
    //       day: "numeric",
    //       month: "long",
    //       year: "numeric",
    //     })} - ${start.toLocaleTimeString("en-US", {
    //       hour: "numeric",
    //       minute: "2-digit",
    //       hour12: true,
    //     })} to ${
    //       end
    //         ? end.toLocaleTimeString("en-US", {
    //             hour: "numeric",
    //             minute: "2-digit",
    //             hour12: true,
    //           })
    //         : ""
    //     }`;

    //     filterDates.push(formattedDate);
    //   }
    // });

    const detailsHTML = `
            ${filterDates
              .map(
                (date, index) =>
                  `<div class="event-item">Day ${index + 1}: ${date}</div>`
              )
              .join("")}
        `;

    const htmlContent =
      `<!DOCTYPE html>
<html lang="en">
<head>
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>Email Template</title>
   <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">
   <style>
      *{margin: 0;padding: 0;box-sizing: border-box;}
        body {
            font-family: 'Roboto', sans-serif;
        }
        .custom_design h3{
            color: #769941;
            font-weight: 700;
            margin-top: 10px;
            font-size: 15px;
        }
        .custom_design p{
            color: black;
            margin-top: 10px;
            font-weight: 400;
            font-size: 10px;
        }
        .bg_color{
            background-color: #e2e2e2!important;
        }
      </style>
</head>
<body>
   <!-- ----------------Email Template start--------------- -->
   <table style="background-color: #FFF; width: 100%;margin: 0 auto; vertical-align: top;caption-side: bottom;" align="center" cellpadding="4" cellspacing="4">
      <tbody>
         <tr>
            <td width="50%" style="width: 50%; height: 50%; position: relative;padding: 4px;border: 2px dashed #212121; border-radius: 16px;vertical-align: top;">
               <div style="max-width: 100%; font-size: 16px;line-height: 24px; font-weight: 400; padding: 16px;">
                     <img src="` +
      event_details?.event_logo +
      `" width="200px" height="83" style="object-fit: contain; max-width: 100%;height: auto;display: block;margin: 0 auto;margin-bottom: 10px;" alt="logo" />
                     <div style="background-color: #e2e2e2; padding: 8px; border-radius: 8px;margin-bottom: 10px;font-weight: 400;font-size: 14px;line-height: 1.2;text-align: center;">
                        ` +
      formattedDateRange +
      `<br>
                        ` +
      event_details?.address +
      `
                     </div>
                     <h3 style="font-weight: 600;font-size: 18px;line-height: 1.2;text-align: center;margin: 0 0 4px;">` +
      (participant_details?.dynamic_fields?.first_name ||
        participant_details?.dynamic_fields?.name ||
        participant_details?.dynamic_fields?.full_name ||
        "") +
      ` ` +
      (participant_details?.dynamic_fields?.last_name || "") +
      `</h3>
                     <p style="font-size: 14px;line-height: 1.4; font-weight: 400;margin: 0;text-align: center;">(` +
      (participant_details?.dynamic_fields?.designation ||
        participant_details?.dynamic_fields?.role ||
        "") +
      `)</p>
                     <img src="` +
      base64Image +
      `" alt="QR Code" width="200px" height="200px" style="object-fit: contain; max-width: 100%;height: auto;display: block;margin-bottom: 10px;margin: 0 auto;" />
                     <p style="font-size: 16px;line-height: 24px; font-weight: 600;margin: 0;text-align: center;">Badge Sponsor</p>
                     <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkovjO7QDFTaE5dS4pQkW4jta1FlvfWXwUdg&amp;s" alt="Event Logo" width="200px" style="object-fit: contain; max-width: 100%;height: auto;display: block;margin: 0 auto;" />
                    <div style="display: block; position: absolute; left: -20px;bottom: 30px;background-color: #b7e24a;color: white;border: none;font-size: 16px;cursor: pointer;transform: rotate(-90deg);margin-bottom: 0;border-radius: 12px;padding: 11px;font-weight: 700;line-height: 1;"><span>VISITOR</span></div>
               </div>
            </td>
            <td width="50%" style="width: 50%; height: 50%; padding: 4px;border: 2px dashed #212121; border-radius: 16px;vertical-align: top;">
               <div class="custom_design" style="position: relative;max-width: 100%; font-size: 14px;line-height: 1.2; font-weight: 400; padding: 16px;">
                <h3>Getting to The Show</h3>
                <p>
                    Bombay Exhibition Centre is India's largest exhibition venue
                    in the private sector. It is conveniently located in Goregaon,
                    Mumbai with close access to the local train, Metro, and the
                    Western Express Highway.
                </p>
                <h3>By Road</h3>
                <p>
                    Bombay Exhibition Center is located along the Westerm
                    Express Highway (service road) in Goregaon East, Mumbai
                    and is easily accessible by auto rickshaws and taxis.
                   
                </p>
                <h3>By Train</h3>
                <p>
                    The nearest local railway stations to reach Bombay
                    Exhibition Center are Ram Mandir Road and Goregoon, which
                    are situated on the Western Suburban Line. Both the stations
                    are well connected to the other railway lines.
                </p>
                <h3>By Metro</h3>
                <p>
                    Goregaon East Station on line 7A (Red Line) is the nearest
                metro station to reach Bombay Exhilbition Center. The venue
                is a couple of minutes walk from the metro station
                    
                </p>
                <h3>By Air</h3>
                <p>
                    Domestic Airport: It takes 30 minutes to travel from Mumbai
                Domestic Airport-Terminal 1 to BEC. The appraximate drivingdistance between Nesco and Mumbai Domestic Airport is 7
                kms. or 4.3 miles or 3.8 nautical miles.
                </p>
               </div>
            </td>
         </tr>
         <tr>
            <td width="50%" style="width: 50%; height: 50%; padding: 4px;border: 2px dashed #212121; border-radius: 16px;vertical-align: top;">
               <div style="position: relative;max-width: 100%; font-size: 14px;line-height: 1.3; font-weight: 400; padding: 16px;">
                  <h3 style="text-align: center;margin-bottom: 10px;color: #b9b907;">Attend the informative <br> sessions in the conference arena</h3>
                  <p style="text-align: center;">Scan the QR code below to view the agenda:</p>
                  <img src="` +
      base64Image +
      `" alt="QR Code" width="200px" height="200px" style="object-fit: contain; max-width: 100%;height: auto;display: block;margin-bottom: 10px;margin: 0 auto;" />
                  <hr/>
                  <h5 style="text-align: center;font-size: 16px;font-weight: 600;margin-bottom: 10px; margin-top: 10px;">Date and Time</h5>
                  <ul style="padding: 0;margin: 0;list-style: none;font-size: 13px;line-height: 1.4;text-align: center;">
                    ` +
      detailsHTML +
      `
                  </ul>
               </div>
            </td>
            <td width="50%" style="width: 50%; height: 50%; padding: 4px;border: 2px dashed #212121; border-radius: 16px;vertical-align: top;">
               <div style="position: relative;max-width: 100%; font-size: 16px;line-height: 24px; font-weight: 400; padding: 16px;">
                  <img src="` +
      event_details?.show_location_image +
      `" alt="Completed Project" style="max-width: 90%;width: 100%; height: auto;display: block;margin: 0 auto;" />
               </div>
            </td>
         </tr>
      </tbody>
   </table>
   <!-- ----------------Email Template end--------------- -->
</body>
</html>`;

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    await page.emulateMediaType("screen");
    let file_name =
      (participant_details.dynamic_fields?.first_name ||
        participant_details.dynamic_fields?.name ||
        participant_details.dynamic_fields?.full_name ||
        "participant") +
      "_" +
      (participant_details.dynamic_fields?.last_name || "") +
      "_event_details.pdf";
    const tempFilePath = path.join(__dirname, file_name);
    const pdfBuffer = await page.pdf({
      path: tempFilePath,
      printBackground: true,
      format: "A4",
    });

    await browser.close();
    const filePath = path.join(__dirname, file_name);

    if (fs.existsSync(filePath)) {
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="' + file_name + '"',
      });
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      res.on("finish", () => {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Error deleting the file:", err);
          } else {
          }
        });
      });
    } else {
      res.status(404).send("File not found");
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while generating the PDF.",
    });
  }
};

export const generateEventPdf = async (req: Request, res: Response) => {
  try {
    const baseUrl = env.BASE_URL;
    const { encrypt_token } = req.params;

    if (!encrypt_token) {
      return res.status(400).json({
        status: "error",
        message: "Token is required.",
      });
    }

    const key = env.ENCRYPT_KEY;
    const iv = env.DECRYPT_KEY;
    const decoded = encrypt_token;
    const decrypted = cryptoService.decryptCombinedValue(decoded, key, iv);
    const { slug, token } = decrypted;

    const event_participant_details = await eventParticipant.findOne({ token });
    if (!event_participant_details) {
      return ErrorResponse(res, "Participant details not found");
    }

    const event_details = await eventSchema.findOne({
      _id: event_participant_details.event_id,
    });
    if (event_details?.event_logo) {
      event_details.event_logo = baseUrl + "/" + event_details.event_logo;
    }

    if (event_details?.event_image) {
      event_details.event_image = baseUrl + "/" + event_details.event_image;
    }
    const participant_details = await participantUsers.findOne({
      _id: event_participant_details.participant_user_id,
    });

    if (!participant_details) {
      return ErrorResponse(res, "Participant User not found");
    }

    const startDates: string[] = event_details?.start_date || [];
    const endDates: string[] = event_details?.end_date || [];
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
      event_id: event_details?.id,
      event_slug: event_details?.event_slug,
    });
    const base64Image = await QRCode.toDataURL(participant_qr_details);

    const htmlContent =
      `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>` +
      event_details?.event_title +
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
      event_details?.event_logo +
      `" alt="Event Logo" style="height: 100px; border-radius: 10px;">
                </div>

                <div class="text-center">
                    <p class="heading">` +
      event_details?.event_title +
      `</p>
                    <p class="subheading">QR Code Scanner</p>
                </div>

                <div class="text-center">
                    <img src="` +
      base64Image +
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
      event_details?.address +
      `
                    </p>
                </div>

                <div class="text-center">
                    <p class="subheading">Participant: ` +
      (participant_details?.dynamic_fields?.first_name ||
        participant_details?.dynamic_fields?.name ||
        "") +
      ` ` +
      (participant_details?.dynamic_fields?.last_name || "") +
      `</p>
                </div>
            </div>
        </body>
        </html>
        `;

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    await page.emulateMediaType("screen");
    let file_name =
      (participant_details.dynamic_fields?.first_name ||
        participant_details.dynamic_fields?.name ||
        "participant") +
      "_" +
      (participant_details.dynamic_fields?.last_name || "") +
      "_event_details.pdf";
    const tempFilePath = path.join(__dirname, file_name);
    const pdfBuffer = await page.pdf({
      path: tempFilePath,
      printBackground: true,
      format: "A4",
    });

    await browser.close();
    const filePath = path.join(__dirname, file_name);

    if (fs.existsSync(filePath)) {
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="' + file_name + '"',
      });
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      res.on("finish", () => {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Error deleting the file:", err);
          } else {
          }
        });
      });
    } else {
      res.status(404).send("File not found");
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while generating the PDF.",
    });
  }
};

export const getParticipantDetails = async (req: Request, res: Response) => {
  try {
    const baseUrl = env.BASE_URL;
    const { event_id, user_token, type } = req.body;
    const token = user_token;

    const event_participant_details = await eventParticipant.findOne({
      token: token,
      event_id: event_id,
    });

    if (!event_participant_details) {
      return ErrorResponse(res, "Participant User not found");
    }

    const event_details = await eventSchema.findOne({
      _id: event_participant_details?.event_id,
    });
    if (!event_details) {
      return ErrorResponse(res, "Event Details found");
    }
    if (event_details?.event_logo) {
      event_details.event_logo = baseUrl + "/" + event_details.event_logo;
    }

    if (event_details?.event_image) {
      event_details.event_image = baseUrl + "/" + event_details.event_image;
    }
    const participant_details = await participantUsers.findOne({
      _id: event_participant_details?.participant_user_id,
    });

    if (!participant_details) {
      return ErrorResponse(res, "Participant User not found");
    }

    if (type == 1) {
      const startDates: string[] = event_details?.start_date || [];
      const endDates: string[] = event_details?.end_date || [];
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
        event_id: event_details?.id,
        event_slug: event_details?.event_slug,
      });
      const base64Image = await QRCode.toDataURL(participant_qr_details);

      const htmlContent =
        `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>` +
        event_details?.event_title +
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
        event_details?.event_logo +
        `" alt="Event Logo" style="max-width: 100px; height: 100px; border-radius: 10px;">
                    </div>

                    <div class="text-center">
                        <p class="heading">` +
        event_details?.event_title +
        `</p>
                        <p class="subheading">QR Code Scanner</p>
                    </div>

                    <div class="text-center">
                        <img src="` +
        base64Image +
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
        event_details?.address +
        `
                        </p>
                    </div>

                    <div class="text-center">
                        <p class="subheading">Participant: ` +
        (participant_details?.dynamic_fields?.first_name ||
          participant_details?.dynamic_fields?.name ||
          "") +
        ` ` +
        (participant_details?.dynamic_fields?.last_name || "") +
        `</p>
                    </div>
                </div>
            </body>
            </html>
            `;

      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
      await page.emulateMediaType("screen");
      let file_name =
        (participant_details.dynamic_fields?.first_name ||
          participant_details.dynamic_fields?.name ||
          "participant") +
        "_" +
        (participant_details.dynamic_fields?.last_name || "") +
        "_event_details.pdf";
      const tempFilePath = path.join(__dirname, file_name);
      const pdfBuffer = await page.pdf({
        path: tempFilePath,
        printBackground: true,
        format: "A4",
      });

      await browser.close();
      const filePath = path.join(__dirname, file_name);

      if (fs.existsSync(filePath)) {
        res.set({
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="' + file_name + '"',
        });
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        res.on("finish", () => {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error("Error deleting the file:", err);
            } else {
            }
          });
        });
      } else {
        res.status(404).send("File not found");
      }
    } else {
      return successResponse(res, "Thank You For Visit this Event.", []);
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while generating the PDF.",
    });
  }
};

export const getParticipantDetailsScanner = async (
  req: Request,
  res: Response
) => {
  try {
    const { event_slug, user_token, scanner_type } = req.body;

    const event_details = await eventSchema.findOne({
      event_slug: event_slug,
    });

    if (!event_details) {
      return ErrorResponse(res, "Event Details Not Found");
    }

    const event_participant_details = await eventParticipant.findOne({
      token: user_token,
      event_id: event_details._id,
    });

    if (!event_participant_details) {
      return ErrorResponse(res, "Participant User Not Found");
    }

    const baseUrl = env.BASE_URL;

    const participant_details = await participantUsers.findOne({
      _id: event_participant_details?.participant_user_id,
    });

    if (!participant_details) {
      return ErrorResponse(res, "Participant User Not Found");
    }
    var color_status = "";
    var scanning_msg = "";

    if (!event_participant_details) {
      return ErrorResponse(res, "Participant details not found");
    }

    if (scanner_type == 0) {
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

    if (scanner_type == 1) {
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
    const resutl = [];
    event_details.event_logo = `${env.BASE_URL}/${event_details.event_logo}`;
    event_details.event_image = `${env.BASE_URL}/${event_details.event_image}`;
    resutl.push(event_details);
    resutl.push(event_participant_details);
    resutl.push(participant_details);
    resutl.push({ color_status: color_status, scanning_msg: scanning_msg });
    return successResponse(res, "Participant User Details", resutl);
  } catch (error) {
    console.error("Error generating PDF:", error);

    return res.status(500).json({
      status: "error",
      message: "An error occurred while generating the PDF.",
    });
  }
};

export const OtpGenerate = async (req: Request, res: Response) => {
  try {
    loginOtpGenerateModel(req.body, (error: any, result: any) => {
      if (error) {
        return ErrorResponse(res, error.message);
      }
      return successResponse(res, "OTP generated successfully", result);
    });
  } catch (error) {
    return ErrorResponse(res, "An error occurred during OTP generation.");
  }
};

export const OtpVerify = async (req: Request, res: Response) => {
  try {
    verifyOtpModel(req.body, (error: any, result: any) => {
      if (error) {
        return ErrorResponse(res, error.message);
      }
      return successResponse(res, "OTP generated successfully", result);
    });
  } catch (error) {
    console.log(error);

    console.error(error);
    return ErrorResponse(res, "An error occurred during OTP verification.");
  }
};

export const updateParticipantUser = async (req: Request, res: Response) => {
  try {
    updateParticipantUserModel(req.body, (error: any, result: any) => {
      if (error) {
        return res.status(500).json({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred.",
        });
      }
      return successCreated(res, result);
    });
  } catch (error) {}
};

export const toggleParticipantBlockStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { participant_id, isBlocked: isBlockedRaw } = req.body;

    if (!participant_id) {
      return res.status(400).json({
        code: "BAD_REQUEST",
        message: "Participant ID is required",
      });
    }

    // Convert string to boolean if needed (for FormData)
    let isBlocked: boolean;
    if (typeof isBlockedRaw === "boolean") {
      isBlocked = isBlockedRaw;
    } else if (typeof isBlockedRaw === "string") {
      isBlocked = isBlockedRaw === "true";
    } else {
      return res.status(400).json({
        code: "BAD_REQUEST",
        message: "isBlocked must be a boolean value or 'true'/'false' string",
      });
    }

    // Find the participant
    const participant = await participantUsers.findById(participant_id);

    if (!participant) {
      return res.status(404).json({
        code: "NOT_FOUND",
        message: "Participant not found",
      });
    }

    // Update the blocked status
    participant.dynamic_fields = {
      ...participant.dynamic_fields,
      isBlocked: isBlocked,
    };

    return res.status(200).json({
      status: 1,
      message: `Participant ${
        isBlocked ? "blocked" : "unblocked"
      } successfully`,
      data: {
        participant_id,
        isBlocked,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error updating participant block status:", error);
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
};

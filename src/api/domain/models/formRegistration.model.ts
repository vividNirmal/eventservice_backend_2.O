import mongoose from "mongoose";
import EventHost from "../schema/eventHost.schema";
import Ticket from "../schema/ticket.schema";
import Form from "../schema/form.schema";
import UserType from "../schema/userType.schema";
import UserTypeMap from "../schema/userTypeMap.schema";
import { createSlug } from "../../lib/slugify";
import FormRegistration from "../schema/formRegistration.schema";
import { env } from "../../../infrastructure/env";
import { loggerMsg } from "../../lib/logger";
import { sendNotification } from "../../services/templateService";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import {
  RekognitionClient,
  IndexFacesCommand,
  CreateCollectionCommand,
} from "@aws-sdk/client-rekognition";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";


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

export const resolveFormUrlModel = async (
  eventSlug: string,
  userTypeSlug: string,
  callback: (error: any, result: any) => void
) => {
  try {
    const baseUrl = env.BASE_URL;
    // Find Event
    const event = await EventHost.findOne({ event_slug: eventSlug });
    if (!event)
      return callback(
        { message: "Event not found", errorType: "EVENT_NOT_FOUND" },
        null
      );
    event.event_logo = `${baseUrl}/uploads/${event.event_logo}`;
    event.event_image = `${baseUrl}/uploads/${event.event_image}`;

    // Resolve userType via mapping or fallback
    let matchedUserType = null;

    const userTypeMaps = await UserTypeMap.find({
      companyId: event.company_id,
      eventId: event._id,
    }).populate("userType");

    for (const map of userTypeMaps) {
      const slug = createSlug(map.shortName);
      if (slug === userTypeSlug) {
        matchedUserType = map.userType;
        break;
      }
    }

    // fallback check (if not mapped)
    if (!matchedUserType) {
      const userTypes = await UserType.find({});
      for (const ut of userTypes) {
        const slug = createSlug(ut.typeName);
        if (slug === userTypeSlug) {
          matchedUserType = ut;
          break;
        }
      }
    }

    if (!matchedUserType)
      return callback(
        { message: "User type not found", errorType: "NOT_FOUND" },
        null
      );

    // Find Ticket
    const ticket = await Ticket.findOne({
      eventId: event._id,
      userType: matchedUserType._id,
      status: "active",
    })
        // .populate("registrationFormId")
      .populate("userType");

    if (!ticket)
      return callback(
        {
          message: "Ticket not found for this user type",
          errorType: "NOT_FOUND",
        },
        null
      );

    const ticketWithUrls = addImageUrls(ticket.toObject());
    // Get Form (either from ticket or event fallback)
    let form = null;
    if (ticket.registrationFormId) {
      form = ticket.registrationFormId;
    } else if (event.selected_form_id) {
      form = await Form.findById(event.selected_form_id);
    }

    // Final Response
    const result = {
      event,
      ticket : ticketWithUrls,
      userType: matchedUserType,
    };

    return callback(null, result);
  } catch (error) {
    return callback(error, null);
  }
};

export const resolveEmailModel = async (
  email: string,
  ticketId: mongoose.Types.ObjectId,
  callback: (error: any, result: any) => void
) => {
  try {
    // Fetch ticket with event populated
    const ticket = await Ticket.findById(ticketId).populate("eventId");
    if (!ticket)
      return callback(
        { message: "Ticket not found.", errorType: "NOT_FOUND" },
        null
      );

    const event = ticket.eventId as any;
    if (!event)
      return callback(
        { message: "Event not found for this ticket.", errorType: "NOT_FOUND" },
        null
      );

    // Check event capacity limit
    // const totalRegistrations = await FormRegistration.countDocuments({
    //   ticketId,
    // });
    // const capacity = event.participant_capacity || 0;

    // if (capacity > 0 && totalRegistrations >= capacity) {
    //   return callback(
    //     {
    //       message: "Ticket limit reached for this event.",
    //       errorType: "LIMIT_REACHED",
    //     },
    //     null
    //   );
    // }
    


    // Check user's existing registrations for this event & ticket
    const emailLower = email.toLowerCase();
    const userRegistrations = await FormRegistration.countDocuments({
      email: emailLower,
      ticketId,
    });

    // Get max buy limit per user from advanced settings
    const maxBuyLimit = ticket.advancedSettings?.ticketBuyLimitMax ?? 1; // fallback if not defined

    // if (userRegistrations >= maxBuyLimit) {
    //   return callback(
    //     {
    //       message: `You have reached the maximum allowed registrations (${maxBuyLimit}) for this ticket.`,
    //       errorType: "LIMIT_REACHED",
    //     },
    //     null
    //   );
    // }

    // If already registered once (for reference)
    if (userRegistrations > 0) {
      const existing = await FormRegistration.findOne({
        email: emailLower,
        ticketId,
      }).populate('eventId').populate("ticketId");

      // ✅ Append base URL if qrImage exists
      if (existing?.qrImage) {
        existing.qrImage = `${env.BASE_URL}/uploads/${existing.qrImage}`;
      }


      return callback(null, {
        alreadyRegistered: true,
        formRegistration: existing,
      });
    }

    // Not registered yet, and not exceeding limits
    return callback(null, {
      alreadyRegistered: false,
    });
  } catch (error) {
    return callback(error, null);
  }
};

// AWS configuration
const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const s3 = new S3Client({
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

// QR code directory setup (reuse from old code)
const qrDirectory = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "..", // for local comment this
  "uploads"
);

if (!fs.existsSync(qrDirectory)) {
  fs.mkdirSync(qrDirectory, { recursive: true });
}

export const storeFormRegistrationModel = async (
  formData: any,
  files: Express.Multer.File[],
  callback: (error: any, result: any) => void
) => {
  try {
    const { ticketId, eventId, email, businessData, ...dynamicFormData } = formData;        
    let parsedBusinessData = null;
    
    if (businessData) {
      // If it's a JSON string, parse it
      if (typeof businessData === 'string') {
        try {
          parsedBusinessData = JSON.parse(businessData);
        } catch (e) {
          console.error('Failed to parse businessData:', e);
        }
      } else if (typeof businessData === 'object') {
        parsedBusinessData = businessData;
      }
    
      if (parsedBusinessData && parsedBusinessData.amount !== undefined && parsedBusinessData.amount !== null) {
        parsedBusinessData.amount = Number(parsedBusinessData.amount);
      }

      if (parsedBusinessData && (!parsedBusinessData.category && !parsedBusinessData.amount)) {
        parsedBusinessData = null;
      }
      
    }

    // Validate required fields
    if (!ticketId || !email) {
      return callback(
        {
          message: "Ticket ID and email are required.",
          errorType: "REQUIRE_PARAMETER",
        },
        null
      );
    }

    // Check ticket validity
    const ticket = await Ticket.findById(ticketId);
    if (!ticket || ticket.status !== "active") {
      return callback(
        { message: "Invalid or inactive ticket.", errorType: "INVALID_TICKET" },
        null
      );
    }

    // Check registration limits via existing resolver
    const emailCheck = await new Promise((resolve, reject) => {
      resolveEmailModel(
        email,
        new mongoose.Types.ObjectId(ticketId),
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    if ((emailCheck as any)?.errorType === "LIMIT_REACHED") {
      return callback(
        {
          message: (emailCheck as any).message,
          errorType: "LIMIT_REACHED",
        },
        null
      );
    }

    // Process face scan if provided
    let faceId = "";
    let faceImageUrl = "";
    let uploadedImageBuffer: Buffer | null = null;

    // Check for face scan in files or base64
    const faceScanFile = files?.find(file => file.fieldname === 'faceScan');
    if (faceScanFile) {
      console.log('🔧 Processing face scan from file upload');
      try {
        const processedFaceData = await processFaceImage(faceScanFile);
        faceId = processedFaceData.faceId;
        faceImageUrl = processedFaceData.imageKey;
        uploadedImageBuffer = processedFaceData.imageBuffer;
      } catch (faceError) {
        console.error('❌ Face processing failed:', faceError);
        return callback(
          { 
            message: `Face processing failed: ${faceError instanceof Error ? faceError.message : 'Unknown error'}`,
            errorType: "FACE_PROCESSING_ERROR"
          },
          null
        );
      }
    } else if (formData.faceScan && typeof formData.faceScan === 'string' && formData.faceScan.startsWith('data:image/')) {
      console.log('🔧 Processing face scan from base64');
      try {
        const processedFaceData = await processFaceImageBase64(formData.faceScan);
        faceId = processedFaceData.faceId;
        faceImageUrl = processedFaceData.imageKey;
        uploadedImageBuffer = processedFaceData.imageBuffer;
        // Remove base64 from form data to avoid storing large strings
        delete formData.faceScan;
        delete dynamicFormData.faceScan;
      } catch (faceError) {
        console.error('❌ Face processing failed:', faceError);
        return callback(
          { 
            message: `Face processing failed: ${faceError instanceof Error ? faceError.message : 'Unknown error'}`,
            errorType: "FACE_PROCESSING_ERROR"
          },
          null
        );
      }
    }

    // Group uploaded files by field name (excluding faceScan)
    const processedFormData = { ...dynamicFormData };
    const filesByField: { [key: string]: Express.Multer.File[] } = {};

    files?.forEach((file) => {
      if (file.fieldname !== 'faceScan') {
        if (!filesByField[file.fieldname]) filesByField[file.fieldname] = [];
        filesByField[file.fieldname].push(file);
      }
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

    // Determine auto-approval
    const isAutoApproved = ticket.advancedSettings?.autoApprovedUser || false;

    // Generate badge number
    const finalBadgeNo = await generateBadgeNumber(ticket);

    // Generate user token for QR code
    const userToken = uuidv4();

    // ✅ Prepare registration data object
    const registrationData: any = {
      email: email.toLowerCase(),
      ticketId: new mongoose.Types.ObjectId(ticketId),
      eventId: eventId ? new mongoose.Types.ObjectId(eventId) : ticket.eventId,
      badgeNo: finalBadgeNo,
      formData: processedFormData,
      approved: isAutoApproved,
      // token: userToken,
    };

    if (faceId) {
      registrationData.faceId = faceId;
    }
    
    if (faceImageUrl) {
      registrationData.faceImageUrl = faceImageUrl;
    }
    
    if (parsedBusinessData) {
      registrationData.businessData = parsedBusinessData;
    }    

    // Create and save record
    const registration = new FormRegistration(registrationData);

    await registration.save();

    console.log('✅ Registration saved successfully:', registration._id);

    // Generate QR code and update registration
    console.log('🔧 Generating QR code for registration...');
    const baseUrl = process.env.BASE_URL;
    
    // Get event details for QR code
    const EventHost = mongoose.model('EventHost');
    let eventDetails = await EventHost.findById(eventId || ticket.eventId);
    
    let qrCodeBase64 = null;
    let qrFileName = null;

    if (eventDetails) {
      // Generate QR code data
      const qrData = JSON.stringify({
        event_id: eventDetails._id,
        event_slug: eventDetails.event_slug,
        formRegistration_id: registration._id,
      });
      
      // Generate base64 QR code
      qrCodeBase64 = await QRCode.toDataURL(qrData);
      console.log('🔧 QR code generated successfully');
      
      // Save QR code as file
      qrFileName = saveQrImage(qrCodeBase64, userToken);
      registration.qrImage =`${qrFileName}`;
      await registration.save();
    }

    // Send welcome email if template exists (non-blocking)
    sendWelcomeEmailAfterRegistration(ticketId, registration).catch((error) => {
      console.error("Failed to send welcome email:", error);
    });

    // Prepare response data
    const responseData: any = {
      registrationId: registration._id,
      badgeNo: finalBadgeNo,
      email: email,
      // token: userToken,
    };
    
    if (faceId) {
      responseData.faceId = faceId;
    }

    if (faceImageUrl) {
      responseData.faceImageUrl = `https://${AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${faceImageUrl}`;
    }

    if (parsedBusinessData) {
      responseData.businessData = parsedBusinessData;
    }

    // Add QR code to response if generated
    if (qrCodeBase64) {
      responseData.qrCode = qrCodeBase64;
      responseData.qrImageUrl = baseUrl + "/uploads/" + qrFileName;
    }

    // Add event details to response if available
    if (eventDetails) {
      responseData.event = {
        id: eventDetails._id,
        event_title: eventDetails.event_title,
        event_slug: eventDetails.event_slug,
        address: eventDetails.address,
      };
    }

    callback(null, responseData);

  } catch (error: any) {
    loggerMsg("Error in storeFormRegistrationModel", error);
    callback(error, null);
  }
};

// Face processing functions (updated to handle disk storage)
async function processFaceImage(file: Express.Multer.File): Promise<{ faceId: string; imageKey: string; imageBuffer: Buffer }> {
  const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg"];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error("Only PNG and JPG files are allowed");
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("File size must be less than 5MB");
  }

  let imageBuffer: Buffer;
  
  // Check if buffer exists (memory storage) or read from disk (disk storage)
  if (file.buffer) {
    // File is in memory
    imageBuffer = file.buffer;
  } else if (file.path) {
    // File is on disk - read it
    try {
      imageBuffer = await fs.promises.readFile(file.path);
    } catch (readError) {
      throw new Error(`Failed to read file from disk: ${readError}`);
    }
  } else {
    throw new Error("No file buffer or path available");
  }

  // Process the image with sharp
  const processedBuffer = await sharp(imageBuffer)
    .resize(100)
    .jpeg({ quality: 100 })
    .toBuffer();

  return await uploadFaceToAWS(processedBuffer, file.mimetype);
}

async function processFaceImageBase64(base64Image: string): Promise<{ faceId: string; imageKey: string; imageBuffer: Buffer }> {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, "base64");
  const mimeType = base64Image.split(';')[0].split(':')[1];

  const allowedMimeTypes = ["image/png", "image/jpeg"];
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new Error("Only PNG and JPG base64 images are allowed");
  }

  const maxSize = 5 * 1024 * 1024;
  if (imageBuffer.length > maxSize) {
    throw new Error("Base64 image size must be less than 5MB");
  }

  const processedBuffer = await sharp(imageBuffer)
    .resize(100)
    .jpeg({ quality: 100 })
    .toBuffer();
  
  // // Return mock AWS upload response
  // return {
  //   faceId: "mock-face-id-" + uuidv4(),
  //   imageKey: "mock-folder/" + uuidv4() + ".jpg",
  //   imageBuffer: processedBuffer,
  // };

  return await uploadFaceToAWS(processedBuffer, mimeType);
}

async function uploadFaceToAWS(imageBuffer: Buffer, mimeType: string): Promise<{ faceId: string; imageKey: string; imageBuffer: Buffer }> {
  // Ensure Rekognition collection exists
  await rekognition.send(new CreateCollectionCommand({
    CollectionId: FACE_COLLECTION_ID,
  })).catch(err => console.log("Collection already exists or error:", err));

  const fileKey = `${uuidv4()}.jpg`;

  // Upload image to S3
  await s3.send(
    new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: fileKey,
      Body: imageBuffer,
      ContentType: mimeType,
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
    throw new Error("No valid face detected in the image");
  }

  const faceId = indexResult.FaceRecords[0].Face?.FaceId || "";

  return { faceId, imageKey: fileKey, imageBuffer };
}

// QR code saving function (reused from old code)
function saveQrImage(base64String: string, fileName: string): string {
  const base64Data = base64String.replace(/^data:image\/png;base64,/, "");
  const filePath = path.join(qrDirectory, `${fileName}.png`);
  fs.writeFileSync(filePath, base64Data, "base64");
  return `${fileName}.png`;
}

async function sendWelcomeEmailAfterRegistration(
  ticketId: mongoose.Types.ObjectId,
  registration: any
) {
  try {
    // // Get event details for template data
    // const event = await EventHost.findById(registration.eventId);
    // const ticket = await Ticket.findById(ticketId);

    const templateData = {
      badgeNo: registration.badgeNo,
      email: registration.email,
      formData: registration.formData || {},
      // ticketName: ticket?.ticketName || "",
      // eventName: event?.eventName || "",
    };

    await sendNotification(
      ticketId,
      "welcome",
      registration.email,
      templateData,
      "email"
    );

    console.log(`✅ Welcome email sent to ${registration.email}`);
  } catch (error) {
    console.error("Error in sendWelcomeEmailAfterRegistration:", error);
    // Don't throw error to avoid affecting registration flow
  }
}

const generateBadgeNumber = async (ticket: any) => {
  const registrationCount = await FormRegistration.countDocuments({
    ticketId: ticket._id,
  });
  const nextNumber = ticket.startCount + registrationCount;
  const padded = nextNumber.toString().padStart(5, "0");
  return `${ticket.serialNoPrefix}-${padded}`;
};

export const getFormRegistrationModel = async (
  registrationId: string,
  callback: (error: any, result: any) => void
) => {
  try {
    if (!registrationId)
      return callback(
        {
          message: "Registration ID is required.",
          errorType: "REQUIRE_PARAMETER",
        },
        null
      );

    const registration = await FormRegistration.findById(registrationId)
      .populate("ticketId")
      .populate("eventId");

    if (!registration)
      return callback(
        { message: "Registration not found.", errorType: "NOT_FOUND" },
        null
      );

    callback(null, registration);
  } catch (error: any) {
    loggerMsg("Error in getFormRegistrationModel", error);
    callback(error, null);
  }
};


export const getFormRegistrationListModel = async (
  page: number,
  limit: number,
  search: string,
  eventId: string,
  approved: string,
  userTypeId: string,
  callback: (error: any, result: any) => void
) => {
  try {
    const currentPage = page || 1;
    const size = limit || 10;
    const skip = (currentPage - 1) * size;

    const filter: any = {};

    // 🔍 Search filters
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { badgeNo: { $regex: search, $options: "i" } },
      ];
    }

    if (eventId) filter.eventId = eventId;
    if (approved !== "") filter.approved = approved === "true";

    // 🧩 Step 1: If userTypeId filter applied → find all tickets with that userType
    let ticketIds: string[] = [];
    if (userTypeId) {
      const tickets = await Ticket.find({ userType: userTypeId }, { _id: 1 }).lean();
      ticketIds = tickets.map((t) => t._id.toString());
      if (ticketIds.length > 0) {
        filter.ticketId = { $in: ticketIds };
      } else {
        // If no tickets found for this userType → return empty result
        return callback(null, {
          registrations: [],
          pagination: {
            currentPage,
            totalPages: 0,
            totalData: 0,
            limit: size,
          },
        });
      }
    }

    // 🧩 Step 2: Fetch form registrations with populated data
    const registrations = await FormRegistration.find(filter)
      .populate({
        path: "ticketId",
        select: "ticketName userType",
        populate: { path: "userType", select: "typeName" },
      })
      .populate("eventId", "event_title event_slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(size)
      .lean();

    const totalCount = await FormRegistration.countDocuments(filter);

    const result = {
      registrations,
      pagination: {
        currentPage,
        totalPages: Math.ceil(totalCount / size),
        totalData: totalCount,
        limit: size,
      },
    };

    return callback(null, result);
  } catch (error) {
    return callback(error, null);
  }
};


export const updateFormRegistrationStatusModel = async (
  registrationId: string,
  approved: boolean,
  callback: (error: any, result: any) => void
) => {
  try {
    const registration = await FormRegistration.findById(registrationId);

    if (!registration) {
      return callback({ message: "Registration not found." }, null);
    }

    registration.approved = approved;

    await registration.save();

    // Send approval/disapproval email notification (non-blocking)
    sendStatusEmailAfterUpdate(registration, approved).catch((error) => {
      console.error("Failed to send status email:", error);
    });

    return callback(null, {
      registrationId: registration._id,
      approved: registration.approved,
      message: approved ? "Registration approved." : "Registration disapproved.",
    });
  } catch (error) {
    return callback(error, null);
  }
};

/**
 * Send approval/disapproval email notification
 */
async function sendStatusEmailAfterUpdate(
  registration: any,
  approved: boolean
) {
  try {
    const actionType = approved ? "approve" : "disapprove";
    
    const templateData = {
      badgeNo: registration.badgeNo,
      email: registration.email,
      formData: registration.formData || {},
      status: approved ? "approved" : "disapproved",
    };

    await sendNotification(
      registration.ticketId,
      actionType,
      registration.email,
      templateData,
      "email"
    );

    console.log(`✅ ${actionType} email sent to ${registration.email}`);
  } catch (error) {
    console.error("Error in sendStatusEmailAfterUpdate:", error);
    // Don't throw error to avoid affecting status update flow
  }
}
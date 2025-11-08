import multer from "multer"
import path from "path"
import fs from "fs"
import { loggerMsg } from "../lib/logger"
import * as bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import {RtcTokenBuilder, RtcRole} from "agora-token";
import sharp from "sharp";

export const uploadImagesFile = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            
            let folder = "";
            const mimeType = file.mimetype;

            // Determine target folder
            if (mimeType.startsWith("image/")) {
                folder = "images";
            } else if (mimeType.startsWith("video/")) {
                folder = "videos";
            } else if (mimeType.startsWith("audio/")) {
                folder = "audio";
            } else if (
                mimeType === "application/pdf" ||
                mimeType.startsWith("application/msword") ||
                mimeType.startsWith("application/vnd") ||
                mimeType === "text/plain" ||
                mimeType === "text/csv" ||
                mimeType === "application/zip" ||
                mimeType === "application/x-rar-compressed" ||
                mimeType === "application/json" ||
                mimeType === "text/xml"
            ) {
                folder = "attachments"; // all doc/text/zip/json files go here
            } else {
                //@ts-ignore
                return cb(new Error("Unsupported file type"), false);
            }

            (file as any).uploadFolder = folder;
            
            const uploadDir = path.resolve(__dirname, "../../../../uploads", folder); // #ForLive
            // const uploadDir = path.resolve(__dirname, "../../../uploads", folder); // #ForLocal
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
            const timestamp = Date.now();
            const fileName = `${timestamp}-${cleanFileName}`;
            cb(null, fileName);
        }
    }),

    fileFilter: (req, file, cb) => {
        const allowedExtensions = [
            // Images
            ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp",
            // Video
            ".mp4", ".mkv", ".avi",
            // Audio
            ".mp3", ".wav", ".aac",
            // Documents / Attachments
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
            ".txt", ".csv", ".zip", ".rar", ".json", ".xml"
        ];

        const ext = path.extname(file.originalname).toLowerCase();

        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            console.log("Unsupported file extension:", ext);
            //@ts-ignore
            cb(new Error(`Unsupported file extension: ${ext}`), false);
        }
    },

    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max per file
        files: 10 // max 10 files
    }
}).any();
// .fields([
//     { name: "event_image", maxCount: 1 },
//     { name: "event_logo", maxCount: 1 },
//     { name: "show_location_image", maxCount: 1 },
//     { name: "event_sponsor", maxCount: 1 },
//     { name: "desktopBannerImage", maxCount: 1 },
//     { name: "mobileBannerImage", maxCount: 1 },
//     { name: "files", maxCount: 10 },
//     { name: "attachments", maxCount: 10 } // unified for attachment usage
// ]);

export async function convertToWebP(
  imageBuffer: Buffer,
  quality: number = 90
): Promise<Buffer> {

  try {
    const webpBuffer = await sharp(imageBuffer)
      .webp({ quality })
      .toBuffer();

    return webpBuffer;
  } catch (error) {
    console.error("Error converting image to WebP:", error);
    throw new Error("Failed to convert image to WebP format");
  }
}

export const uploadEventImagesFile = multer({
    storage: multer.memoryStorage(), // Use memory storage to process with Sharp
    fileFilter: (req, file, cb) => {
        const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff"];
        const ext = path.extname(file.originalname).toLowerCase();

        if (imageExtensions.includes(ext) && file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            console.log("Unsupported file type - only images are allowed:", ext, file.mimetype);
            //@ts-ignore
            cb(new Error(`Only image files are allowed. Unsupported: ${ext}`), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max per file
        files: 10 // max 10 files
    }
}).any();

// Middleware to process and save images as WebP
export const processAndSaveImages = async (req: any, res: any, next: any) => {
    if (!req.files || req.files.length === 0) {
        return next();
    }

    const uploadDir = path.resolve(__dirname, "../../../../uploads", "images"); // #ForLive
    // const uploadDir = path.resolve(__dirname, "../../../uploads", "images"); // #ForLocal

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const processPromises = req.files.map(async (file: any) => {
        try {
            const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
            const timestamp = Date.now();
            const fileNameWithoutExt = cleanFileName.replace(/\.[^/.]+$/, "");
            const webpFileName = `${timestamp}-${fileNameWithoutExt}.webp`;
            const webpPath = path.join(uploadDir, webpFileName);

            // Convert buffer to WebP
            const webpBuffer = await sharp(file.buffer)
                .webp({ 
                    quality: 80,
                    effort: 6
                })
                .toBuffer();

            // Save WebP file
            fs.writeFileSync(webpPath, webpBuffer);

            // Replace file info with WebP version
            file.filename = webpFileName;
            file.path = webpPath;
            file.mimetype = 'image/webp';
            file.size = webpBuffer.length;
            (file as any).uploadFolder = "images";
            delete file.buffer; // Clean up memory

        } catch (error) {
            console.error("Error processing image:", error);
            // If conversion fails, you might want to save the original or handle the error
        }
    });

    Promise.all(processPromises)
        .then(() => next())
        .catch((error) => {
            console.error("Error in image processing:", error);
            next();
        });
};


export const uploadTemplateAttachments = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadDir = path.resolve(__dirname, '../../../uploads/attachments');
            
            // Create directory if it doesn't exist
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            // Create unique filename with timestamp and original name
            const timestamp = Date.now();
            const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const fileName = `attachment-${timestamp}-${cleanFileName}`;
            cb(null, fileName);
        }
    }),
    fileFilter: (req, file, cb) => {
        // Allowed file types for email attachments
        const allowedMimeTypes = [
            // Images
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain', 'text/csv',
            // Archives
            'application/zip', 'application/x-rar-compressed',
            // Other common types
            'application/json', 'text/xml'
        ];

        const allowedExtensions = [
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
            '.pdf',
            '.doc', '.docx',
            '.xls', '.xlsx',
            '.ppt', '.pptx',
            '.txt', '.csv',
            '.zip', '.rar',
            '.json', '.xml'
        ];

        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
            cb(null, true);
        } else {
            console.log("Unsupported file type for attachment:", file.mimetype, fileExtension);
            cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: images, PDF, Word, Excel, PowerPoint, text files, and archives.`));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 10 // Maximum 10 files
    }
}); // 'attachments' field name, max 10 files


export const logErrorMessage = (error:any, customMessage:any) => {
    // Log the error details for debugging
    if (error instanceof Error) {
        loggerMsg(`${customMessage}\nError Name${error.name}\nError message: ${error.message}\nStack trace: ${error.stack}`);
    } else {
        loggerMsg(`${customMessage}\nUnexpected error: ${error}`);
    }
}

export const hashdPassword = async (password:string) => {
    return await bcrypt.hash(password, 10)
}

export const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateToken = (userId: string): string => {
    return jwt.sign({ userId }, "supersecretkeys", { expiresIn: "1h" });
};

export const convertToSlug = (text: string): string => {
    return text
        .toLowerCase()                           
        .trim()                                 
        .replace(/\s+/g, '-')                    
        .replace(/[^\w\-]+/g, '')               
        .replace(/\-\-+/g, '-')                
        .replace(/^-+/, '')                     
        .replace(/-+$/, '');                    
};

export const generateAgoraToken = (
    appId: string,
    appCertificate: string,
    channelName: string,
    uid: number,
    expirationTimeInSeconds: number = 3600
): string => {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    return RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        RtcRole.PUBLISHER,
        privilegeExpiredTs,
        privilegeExpiredTs
    )
}


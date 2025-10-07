import multer from "multer"
import path from "path"
import fs from "fs"
import { loggerMsg } from "../lib/logger"
import * as bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import {RtcTokenBuilder, RtcRole} from "agora-token";

export const uploadImagesFile = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            
            let folder = "";
            const mimeType = file.mimetype;

            if(mimeType.startsWith('image/')){
                folder = "images"
            }else if(mimeType.startsWith('video/')){
                folder = "videos"
            }else if(mimeType.startsWith('audio/')){
                folder = "audio"
            }else if(mimeType === "application/pdf" || mimeType.startsWith('application/msword') || mimeType.startsWith('application/vnd')){
                folder = "documents";
            }else{
                //@ts-ignore
                return cb(new Error('Unsupported file type'), false)
            }

            const uploadDir = path.resolve(__dirname,'../../../uploads',folder);
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const mimeType = file.mimetype;
            let folder = "";

            // Assign folder based on mime type
            if (mimeType.startsWith('image/')) {
                folder = "images";
            } else if (mimeType.startsWith('video/')) {
                folder = "videos";
            } else if (mimeType.startsWith('audio/')) {
                folder = "audio";
            } else if (mimeType === "application/pdf" || mimeType.startsWith('application/msword') || mimeType.startsWith('application/vnd')) {
                folder = "documents";
            }
            // Modify filename to include the folder name for easy reference
            // const modifiedFileName = `${folder}-${Date.now()}-${file.originalname}`;
            const modifiedFileName = `${folder}-${file.originalname}`;
            cb(null, modifiedFileName);
        }
    }),
    fileFilter: (req, file, cb) => {
        const allowedImagesExits = ['.png', '.jpg', '.jpeg'];
        const allowedVideosExits = ['.mp4', '.mkv', '.avi'];
        const allowedAudioExits = ['.mp3', '.wav', '.aac'];
        const allowedDocsExits = ['.pdf','.doc', '.docx'];

        const ext = path.extname(file.originalname).toLowerCase();
        if(allowedImagesExits.includes(ext) || allowedVideosExits.includes(ext) || allowedAudioExits.includes(ext) || allowedDocsExits.includes(ext)){
             cb(null, true)
        }else{
            console.log("Unsuported file extension:",ext)
            //@ts-ignore
            cb(new Error(`Unsupported file extension: ${ext}`), false)
        }
    },
}).fields([
    { name: 'event_image', maxCount: 1 },
    { name: 'event_logo', maxCount: 1 },
    { name: 'show_location_image', maxCount: 1 },
    { name: 'event_sponsor', maxCount: 1 },
    { name: 'desktopBannerImage', maxCount: 1 },
    { name: 'mobileBannerImage', maxCount: 1 },
    { name: 'files', maxCount: 10 } // Keep files for backward compatibility
])

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


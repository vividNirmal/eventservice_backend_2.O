import nodemailer from 'nodemailer';
import { loggerMsg } from "../../api/lib/logger";
import dotenv from 'dotenv';
import e from 'express';
dotenv.config(); 
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "mail.laptoprental.co", // Use environment variable or default to your SMTP host
  port: 465,                    
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
   tls: {
    rejectUnauthorized: false
  }
});

  // transporter.verify(function(error, success) {
  //   if (error) {
  //     console.error("SMTP connection error:", error);
  //   } else {
  //     console.log("SMTP server is ready to take messages");
  //   }
  // });

export const EmailService = {

  
  async sendEmail(to: string, subject: string, htmlContent: string, username?:string | null,) {
  const getEmailuser = username ? username : process.env.PLATFORMNAME;
  const mailOptions = {    
        from: `"${getEmailuser}" <${process.env.EMAIL_USER}>`, // Use the environment variable for the sender's email
        to: to.trim(), // Ensure the recipient's email is trimmed of whitespace
        subject,
        html: htmlContent,htmlContent
      };
    try {
      const info = await transporter.sendMail(mailOptions);
      loggerMsg("✅ sending mail ss successfully.");
      console.log(`✅ Email sent successfully to ${to}. Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      loggerMsg("✅ sending mail ss successfully not working.");
      console.error(`❌ Failed to send email to ${to}:`, error);
      throw error;
    }
  },
};

export interface EmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  username?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: any[];
}

export const EmailServiceNew = {
  async sendEmail(options: EmailOptions) {
    const { to, subject, htmlContent, username, cc, bcc, attachments = [] } = options;
    
    // Extract base64 images and convert to attachments
    const { processedHtml, imageAttachments } = this.processBase64Images(htmlContent);
    
    const mailOptions = {    
      from: `"${process.env.EMAIL_FROM}" <${process.env.EMAIL_USER}>`,
      to: to.trim(),
      subject,
      html: processedHtml,
      cc: cc && cc.length > 0 ? cc : undefined,
      bcc: bcc && bcc.length > 0 ? bcc : undefined,
      attachments: [...attachments, ...imageAttachments]
      // attachments: attachments && attachments.length > 0 ? attachments : undefined
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      loggerMsg("✅ Email sent successfully.");
      console.log(`✅ Email sent successfully to ${to}. Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      loggerMsg("❌ Failed to send email.");
      console.error(`❌ Failed to send email to ${to}:`, error);
      throw error;
    }
  },

  processBase64Images(htmlContent: string): { processedHtml: string; imageAttachments: any[] } {
    const imageAttachments: any[] = [];
    let processedHtml = htmlContent;
    let imageIndex = 0;

    // Regex to find base64 images
    const base64Regex = /<img[^>]*src="data:image\/([^;]+);base64,([^">]*)"[^>]*>/g;
    
    processedHtml = processedHtml.replace(base64Regex, (match, imageType, base64Data) => {
      const cid = `image_${imageIndex++}`;
      
      imageAttachments.push({
        filename: `${cid}.${imageType}`,
        content: base64Data,
        encoding: 'base64',
        cid: cid // same cid value used in the img src
      });

      return match.replace(`data:image/${imageType};base64,${base64Data}`, `cid:${cid}`);
    });

    return { processedHtml, imageAttachments };
  }
};
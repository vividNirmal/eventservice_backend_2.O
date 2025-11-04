// services/templateService.ts
import mongoose from 'mongoose';
import Template from '../domain/schema/template.schema';
import UserTemplate from '../domain/schema/userTemplate.schema';
import Ticket from '../domain/schema/ticket.schema';
import { EmailServiceNew } from './sendEmail.service';

/**
 * Get appropriate template for ticket notification
 */
export async function getNotificationTemplate(
  ticketId: mongoose.Types.ObjectId,
  actionType: string,
  channel: 'email' | 'sms' | 'whatsapp' = 'email'
) {
  try {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    const notificationConfig = ticket.notifications;
    let channelConfig;

    switch (channel) {
      case 'email':
        channelConfig = notificationConfig.emailNotification;
        break;
      case 'sms':
        channelConfig = notificationConfig.smsNotification;
        break;
      case 'whatsapp':
        channelConfig = notificationConfig.whatsappNotification;
        break;
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }

    if (!channelConfig?.enabled) return null;

    const templateMapping = channelConfig.templates.find(
      (template: any) => template.actionType === actionType
    );

    if (!templateMapping) return null;

    let template;
    if (templateMapping.isCustom) {
      template = await UserTemplate.findOne({
        _id: templateMapping.templateId,
        status: 'active',
        type: channel,
      });
    } else {
      template = await Template.findOne({
        _id: templateMapping.templateId,
        status: 'active',
        type: channel,
      });
    }

    return template;
  } catch (error) {
    console.error('Error fetching notification template:', error);
    throw error;
  }
}

/**
 * Replace placeholders in template with actual data
 */
export function compileTemplate(templateContent: string, data: any): string {
  let compiledContent = templateContent;    
  const placeholderRegex = /\{\{(\w+)\}\}/g;
  const matches = [...templateContent.matchAll(placeholderRegex)];  
  const uniquePlaceholders = new Set(matches.map(match => match[1]));  
  uniquePlaceholders.forEach(key => {
    let value = '';    
    if (data[key] !== undefined && data[key] !== null) {
      value = Array.isArray(data[key]) ? data[key].join(', ') : String(data[key]);
    }     
    else if (data.formData?.[key] !== undefined && data.formData[key] !== null) {
      value = Array.isArray(data.formData[key]) ? data.formData[key].join(', ') : String(data.formData[key]);
    }    
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    compiledContent = compiledContent.replace(pattern, value);
  });
  
  return compiledContent;
}

/**
 * Send notification for specific action type
 */
export async function sendNotification(
  ticketId: mongoose.Types.ObjectId,
  actionType: string,
  recipientEmail: string,
  templateData: any,
  channel: 'email' | 'sms' | 'whatsapp' = 'email',
  additionalAttachments: any[] = []
) {
  try {
    const template = await getNotificationTemplate(ticketId, actionType, channel);    
    if (!template) {
      console.log(`No ${actionType} template found for ticket ${ticketId}`);
      return null;
    }

    if (channel === 'email') {
      const compiledSubject = compileTemplate(template.subject || '', templateData);      
      const compiledContent = compileTemplate(template.content, templateData);
      const emailOptions: any = {
        to: recipientEmail,
        subject: compiledSubject,
        htmlContent: compiledContent,
        attachments: []
      };

      if ('defaultOption' in template) {
        const userTemplate = template as any;
        if (userTemplate.defaultOption?.used) {
          emailOptions.cc = userTemplate.defaultOption.cc;
          emailOptions.bcc = userTemplate.defaultOption.bcc;
        }

        // Add template attachments
        if (userTemplate.attachments?.length > 0) {
          emailOptions.attachments.push(...userTemplate.attachments.map((att: any) => ({
            filename: att.originalName || att.filename,
            path: `${process.env.BASE_URL}/uploads/${att.path}`,
            contentType: att.mimetype,
          })));
        }
      }

      // Add additional attachments (like the PDF badge)
      if (additionalAttachments.length > 0) {
        emailOptions.attachments.push(...additionalAttachments);
      }

      return await EmailServiceNew.sendEmail(emailOptions);
    }

    return null;
  } catch (error) {
    console.error(`Error sending ${actionType} notification:`, error);
    throw error;
  }
}

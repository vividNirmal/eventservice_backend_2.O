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

  const placeholders = {
    '{{badgeNo}}': data.badgeNo || '',
    '{{email}}': data.email || '',
    '{{registrationId}}': data.registrationId || '',
    '{{ticketName}}': data.ticketName || '',
    '{{eventName}}': data.eventName || '',
  };

  Object.entries(placeholders).forEach(([placeholder, value]) => {
    compiledContent = compiledContent.replace(new RegExp(placeholder, 'g'), value);
  });

  if (data.formData) {
    Object.entries(data.formData).forEach(([key, value]) => {
      const placeholder = `{{formData.${key}}}`;
      const stringValue = Array.isArray(value) ? value.join(', ') : String(value || '');
      compiledContent = compiledContent.replace(new RegExp(placeholder, 'g'), stringValue);
    });
  }

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
  channel: 'email' | 'sms' | 'whatsapp' = 'email'
) {
  try {
    const template = await getNotificationTemplate(ticketId, actionType, channel);

    console.log(`📧 template>>>>>>>>>>>>>`, template);

    if (!template) {
      console.log(`No ${actionType} template found for ticket ${ticketId}`);
      return null;
    }

    if (channel === 'email') {
      const compiledSubject = compileTemplate(template.subject || '', templateData);
      console.log(`📧 compiledSubject>>>>>>>>>>>>>`, compiledSubject);
      const compiledContent = compileTemplate(template.content, templateData);

      const emailOptions: any = {
        to: recipientEmail,
        subject: compiledSubject,
        htmlContent: compiledContent,
      };

      if ('defaultOption' in template) {
        const userTemplate = template as any;
        if (userTemplate.defaultOption?.used) {
          emailOptions.cc = userTemplate.defaultOption.cc;
          emailOptions.bcc = userTemplate.defaultOption.bcc;
        }

        if (userTemplate.attachments?.length > 0) {
          emailOptions.attachments = userTemplate.attachments.map((att: any) => ({
            filename: att.originalName || att.filename,
            path: `${process.env.BASE_URL}/uploads/${att.path}`,
            contentType: att.mimetype,
          }));
        }
      }

      return await EmailServiceNew.sendEmail(emailOptions);
    }

    return null;
  } catch (error) {
    console.error(`Error sending ${actionType} notification:`, error);
    throw error;
  }
}

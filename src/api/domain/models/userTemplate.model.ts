import mongoose from "mongoose";
import UserTemplateSchema from "../schema/userTemplate.schema";

interface IStoreUserTemplate {
  name: string;
  formName?: string;
  type: "email" | "sms" | "whatsapp";
  typeId: string;
  text: string;
  subject?: string;
  content: string;
  attachments: any[];
  defaultOption: {
    used: boolean;
    cc?: string[];
    bcc?: string[];
  };
  status: "active" | "inactive";
  userId?: string;
  companyId?: string;
  eventId?: string;
}

interface IUpdateUserTemplate {
  name?: string;
  formName?: string;
  type?: "email" | "sms" | "whatsapp";
  typeId?: string;
  text?: string;
  subject?: string;
  content?: string;
  attachments?: any[];
  defaultOption?: {
    used: boolean;
    cc?: string[];
    bcc?: string[];
  };
  status?: "active" | "inactive";
  userId?: string;
  companyId?: string;
  eventId?: string;
}

interface IUserTemplateData {
  name: string;
  formName?: string;
  type: "email" | "sms" | "whatsapp";
  typeId: string;
  text: string;
  subject?: string;
  content: string;
  attachments: any[];
  defaultOption: {
    used: boolean;
    cc?: string[];
    bcc?: string[];
  };
  status: "active" | "inactive";
  userId?: string;
  companyId?: string;
  eventId?: string;
}

export const storeUserTemplate = async (
  templateData: IStoreUserTemplate, 
  callback: (error: any, result: any) => void
) => {
  try {
    const newTemplate = new UserTemplateSchema({
      name: templateData.name,
      formName: templateData.formName,
      type: templateData.type,
      typeId: templateData.typeId,
      text: templateData.text,
      subject: templateData.subject,
      content: templateData.content,
      attachments: templateData.attachments,
      defaultOption: templateData.defaultOption,
      status: templateData.status,
      userId: templateData.userId,
      companyId: templateData.companyId,
      eventId: templateData.eventId,
    });

    const savedTemplate = await newTemplate.save();
    return callback(null, { savedTemplate });
  } catch (error) {
    console.error("Error during template creation:", error);
    return callback(error, null);
  }
};

export const updateUserTemplate = async (
  templateData: IUpdateUserTemplate & { templateId: string }, 
  callback: (error: any, result?: any) => void
) => {
  try {
    const existingTemplate = await UserTemplateSchema.findById(templateData.templateId);

    if (!existingTemplate) {
      return callback({ message: "Template not found" }, null);
    }

    // Update only the fields that are provided in templateData
    if (templateData.name) existingTemplate.name = templateData.name;
    if (templateData.formName !== undefined) existingTemplate.formName = templateData.formName;
    if (templateData.type) existingTemplate.type = templateData.type;
    // if (templateData.typeId) existingTemplate.typeId = templateData.typeId;
    if (templateData.text !== undefined) existingTemplate.text = templateData.text;
    if (templateData.subject !== undefined) existingTemplate.subject = templateData.subject;
    if (templateData.content !== undefined) existingTemplate.content = templateData.content;
    if (templateData.attachments) existingTemplate.attachments = templateData.attachments;
    if (templateData.defaultOption) existingTemplate.defaultOption = templateData.defaultOption;
    if (templateData.status) existingTemplate.status = templateData.status;

    if (templateData.typeId) existingTemplate.typeId = new mongoose.Types.ObjectId(templateData.typeId);
    if (templateData.userId) existingTemplate.userId = new mongoose.Types.ObjectId(templateData.userId);
    if (templateData.companyId) existingTemplate.companyId = new mongoose.Types.ObjectId(templateData.companyId);
    if (templateData.eventId) existingTemplate.eventId = new mongoose.Types.ObjectId(templateData.eventId);

    const savedTemplate = await existingTemplate.save();
    return callback(null, { message: "Template updated successfully", savedTemplate });

  } catch (error) {
    console.error("Error during template update:", error);
    return callback(error, null);
  }
};

export const userTemplateList = async (
  templateData: IUserTemplateData,
  page: number, 
  pageSize: number, 
  searchQuery: string, 
  type: string,
  eventId: string,
  typeId: string,
  callback: (error: any, result: any) => void
) => {
  try {
    const currentPage = page || 1;
    const size = pageSize || 10;
    const skip = (currentPage - 1) * size;

    const searchFilter: any = {};

    if (searchQuery) {
      searchFilter.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { formName: { $regex: searchQuery, $options: 'i' } },
        { subject: { $regex: searchQuery, $options: 'i' } },
        { text: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // Filter by type if provided
    if (type) {
      searchFilter.type = type;
    }

    if (eventId) {
      searchFilter.eventId = eventId;
    }

    if (typeId) {
      searchFilter.typeId = typeId;
    }

    // Add user/company/event context filters
    if (templateData.userId) {
      searchFilter.userId = templateData.userId;
    }
    if (templateData.companyId) {
      searchFilter.companyId = templateData.companyId;
    }

    let templates = await UserTemplateSchema.find(searchFilter)
      .populate('typeId', 'typeName type')
      .skip(skip)
      .limit(size)
      .sort({ createdAt: -1 })
      .lean();

    const totalTemplates = await UserTemplateSchema.countDocuments(searchFilter);

    const result = {
      templates: templates,
      pagination: {
        currentPage: currentPage,
        totalPages: Math.ceil(totalTemplates / size),
        totalData: totalTemplates,
        pageSize: size
      }
    };

    return callback(null, result);
    
  } catch (error) {
    return callback(error, null);
  }
};

export const getUserTemplateById = async (
  templateId: string,
  callback: (error: any, result?: any) => void
) => {
  try {
    const template = await UserTemplateSchema.findById(templateId)
      .populate('typeId', 'typeName type');

    if (!template) {
      return callback({ message: "Template not found" }, null);
    }

    return callback(null, template);
  } catch (error) {
    console.error("Error fetching template:", error);
    return callback(error, null);
  }
};

export const deleteUserTemplates = async (
  templateId: string,
  callback: (error: any, result?: any) => void
) => {
  try {
    const result = await UserTemplateSchema.deleteOne({ _id: templateId });

    if (result.deletedCount === 0) {
      return callback({ message: "No templates found with the provided IDs." }, null);
    }

    return callback(null, { 
      message: `Successfully deleted ${result.deletedCount} template(s).`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error("Error deleting templates:", error);
    return callback(error, null);
  }
};
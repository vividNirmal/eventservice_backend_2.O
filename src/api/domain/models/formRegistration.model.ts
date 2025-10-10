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
      ticket,
      userType: matchedUserType,
    };

    return callback(null, result);
  } catch (error) {
    return callback(error, null);
  }
};

export const resolveEmailModel = async (
  regEmail: string,
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
    const totalRegistrations = await FormRegistration.countDocuments({
      ticketId,
    });
    const capacity = event.participant_capacity || 0;

    if (capacity > 0 && totalRegistrations >= capacity) {
      return callback(
        {
          message: "Ticket limit reached for this event.",
          errorType: "LIMIT_REACHED",
        },
        null
      );
    }

    // Check user's existing registrations for this event & ticket
    const emailLower = regEmail.toLowerCase();
    const userRegistrations = await FormRegistration.countDocuments({
      regEmail: emailLower,
      ticketId,
    });

    // Get max buy limit per user from advanced settings
    const maxBuyLimit = ticket.advancedSettings?.ticketBuyLimitMax ?? 1; // fallback if not defined

    if (userRegistrations >= maxBuyLimit) {
      return callback(
        {
          message: `You have reached the maximum allowed registrations (${maxBuyLimit}) for this ticket.`,
          errorType: "LIMIT_REACHED",
        },
        null
      );
    }

    // If already registered once (for reference)
    if (userRegistrations > 0) {
      const existing = await FormRegistration.findOne({
        regEmail: emailLower,
        ticketId,
      });

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

export const storeFormRegistrationModel = async (
  formData: any,
  files: Express.Multer.File[],
  callback: (error: any, result: any) => void
) => {
  try {
    const { ticketId, eventId, regEmail, ...dynamicFormData } = formData;

    // Validate required fields
    if (!ticketId || !regEmail) {
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
        regEmail,
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

    // Group uploaded files by field name
    const processedFormData = { ...dynamicFormData };
    const filesByField: { [key: string]: Express.Multer.File[] } = {};

    files.forEach((file) => {
      if (!filesByField[file.fieldname]) filesByField[file.fieldname] = [];
      filesByField[file.fieldname].push(file);
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

    // Create and save record
    const registration = new FormRegistration({
      regEmail: regEmail.toLowerCase(),
      ticketId: new mongoose.Types.ObjectId(ticketId),
      eventId: eventId ? new mongoose.Types.ObjectId(eventId) : ticket.eventId,
      badgeNo: finalBadgeNo,
      formData: processedFormData,
      approved: isAutoApproved,
    });

    await registration.save();

    // Send welcome email if template exists (non-blocking)
    sendWelcomeEmailAfterRegistration(ticketId, registration).catch((error) => {
      console.error("Failed to send welcome email:", error);
    });

    callback(null, {
      registrationId: registration._id,
      badgeNo: finalBadgeNo,
      email: regEmail,
    });
  } catch (error: any) {
    loggerMsg("Error in storeFormRegistrationModel", error);
    callback(error, null);
  }
};

async function sendWelcomeEmailAfterRegistration(
  ticketId: mongoose.Types.ObjectId,
  registration: any
) {
  try {
    // Get event details for template data
    const event = await EventHost.findById(registration.eventId);
    const ticket = await Ticket.findById(ticketId);

    const templateData = {
      badgeNo: registration.badgeNo,
      email: registration.regEmail,
      registrationId: registration._id.toString(),
      ticketName: ticket?.ticketName || "",
      eventName: event?.eventName || "",
      formData: registration.formData || {},
    };

    await sendNotification(
      ticketId,
      "welcome",
      registration.regEmail,
      templateData,
      "email"
    );

    console.log(`✅ Welcome email sent to ${registration.regEmail}`);
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

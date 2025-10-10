import mongoose from "mongoose";
import EventHost from "../schema/eventHost.schema";
import Ticket from "../schema/ticket.schema";
import Form from "../schema/form.schema";
import UserType from "../schema/userType.schema";
import UserTypeMap from "../schema/userTypeMap.schema";
import { createSlug } from "../../lib/slugify";
import FormRegistration from "../schema/formRegistration.schema";
import { env } from "../../../infrastructure/env";

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
      event.event_image =  `${baseUrl}/uploads/${event.event_image}`;

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
    //   .populate("registrationFormId")
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

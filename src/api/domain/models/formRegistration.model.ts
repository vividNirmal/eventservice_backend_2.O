import mongoose from "mongoose";
import UserTemplateSchema from "../schema/userTemplate.schema";



import EventHost from "../schema/eventHost.schema";
import Ticket from "../schema/ticket.schema";
import Form from "../schema/form.schema";
import UserType from "../schema/userType.schema";
import UserTypeMap from "../schema/userTypeMap.schema";
import { createSlug } from "../../lib/slugify";

export const resolveFormUrlModel = async (
  eventSlug: string,
  userTypeSlug: string,
  callback: (error: any, result: any) => void
) => {
  try {
    // 1️⃣ Find Event
    const event = await EventHost.findOne({ event_slug: eventSlug });
    if (!event) throw new Error("Event not found");

    // 2️⃣ Resolve userType via mapping or fallback
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

    if (!matchedUserType) throw new Error("User type not found");

    // 3️⃣ Find Ticket
    const ticket = await Ticket.findOne({
      eventId: event._id,
      userType: matchedUserType._id,
      status: "active",
    })
      .populate("registrationFormId")
      .populate("userType");

    if (!ticket) throw new Error("Ticket not found for this user type");

    // 4️⃣ Get Form (either from ticket or event fallback)
    let form = null;
    if (ticket.registrationFormId) {
      form = ticket.registrationFormId;
    } else if (event.selected_form_id) {
      form = await Form.findById(event.selected_form_id);
    }

    // 5️⃣ Final Response
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
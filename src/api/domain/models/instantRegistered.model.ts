import { any } from "joi";
import { loggerMsg } from "../../lib/logger";
import ticketSchema from "../schema/ticket.schema";
import userTypeSchema from "../schema/userType.schema";

export const instantRegisteredFormRegistrationModel = async (
  registerData: any,
  callback: (error: any, result: any) => void
) => {
  try {
    const { event_id, name, contact_no } = registerData;
    const Attendees: any = await userTypeSchema
      .findOne({ typeName: "Event Attendees" })
      .sort({ order: 1 })
      .lean();
    const ticket: any = await ticketSchema
      .findOne({
        eventId: event_id,
        userType: Attendees?._id,
      })
      .populate("registrationFormId");

    const nameField = ticket?.registrationFormId?.pages
      ?.flatMap((page: any) => page.elements)
      ?.find((el: any) => el.mapField === "first_name").fieldName;

    const contactField = ticket?.registrationFormId?.pages
      ?.flatMap((page: any) => page.elements)
      ?.find((el: any) => el.mapField === "contact_no").fieldName;
    console.log(nameField, contactField);

    return callback(null, ticket);
  } catch (error: any) {
    loggerMsg("Error in instantRegisteredFormRegistrationModel", error);
    callback(error, null);
  }
};

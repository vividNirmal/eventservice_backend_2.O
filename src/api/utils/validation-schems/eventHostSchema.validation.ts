import Joi from "joi";

// Create validation for Event Host
export const eventHostSchema = Joi.object({
  eventName: Joi.string().required().messages({
    "any.required": "Event Name is required.",
    "string.base": "Event Name must be a string."
  }),
  eventShortName: Joi.string().required().messages({
    "any.required": "Event Short Name is required.",
    "string.base": "Event Short Name must be a string."
  }),
  eventTimeZone: Joi.string().required().messages({
    "any.required": "Time Zone is required.",
    "string.base": "Time Zone must be a string."
  }),
  startDate: Joi.string().optional().messages({
    "string.base": "Start Date must be a string."
  }),
  startTime: Joi.string().optional().messages({
    "string.base": "Start Time must be a string."
  }),
  endDate: Joi.string().optional().messages({
    "string.base": "End Date must be a string."
  }),
  endTime: Joi.string().optional().messages({
    "string.base": "End Time must be a string."
  }),
  dateRanges: Joi.string().optional().custom((value, helpers) => {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        return helpers.error('dateRanges.array');
      }
      for (const range of parsed) {
        if (!range.startDate || !range.startTime || !range.endDate || !range.endTime) {
          return helpers.error('dateRanges.missing');
        }
      }
      return value;
    } catch (error) {
      return helpers.error('dateRanges.invalid');
    }
  }).messages({
    "dateRanges.array": "Date ranges must be an array.",
    "dateRanges.missing": "Each date range must have startDate, startTime, endDate, and endTime.",
    "dateRanges.invalid": "Date ranges must be valid JSON."
  }),
  location: Joi.string().optional(),
  eventCategory: Joi.array()
    .items(
      Joi.string().required().messages({
        "any.required": "Each Event Category is required.",
        "string.base": "Each Event Category must be a string."
      })
    )
    .required()
    .messages({
      "any.required": "Event Category is required.",
      "array.base": "Event Category must be an array of strings."
    }),
  
  // Optional event detail fields (from integrated form)
  company_name: Joi.string().optional(),
  event_title: Joi.string().optional(),
  event_description: Joi.string().optional(),
  event_slug: Joi.string().optional(),
  google_map_url: Joi.string().uri().optional().messages({
    "string.uri": "Google Maps URL must be a valid URL."
  }),
  address: Joi.string().optional(),
  event_type: Joi.string().optional(),
  eventType: Joi.string().optional(),
  organizer_name: Joi.string().optional(),
  organizer_email: Joi.string().email().optional().messages({
    "string.email": "Organizer email must be a valid email address."
  }),
  organizer_phone: Joi.string().optional(),
  with_face_scanner: Joi.number().integer().min(0).max(1).optional(),
  show_location_image: Joi.string().optional(),
  event_sponsor: Joi.string().optional(),
  start_date: Joi.array().items(Joi.string()).optional(),
  end_date: Joi.array().items(Joi.string()).optional(),
  event_website: Joi.string().uri().optional().messages({
    "string.uri": "Event website must be a valid URL."
  }),
  event_image: Joi.string().optional(),
  event_logo: Joi.string().optional(),
  event_banner_image: Joi.string().optional(),
  facebook_event_url: Joi.string().uri().optional().messages({
    "string.uri": "Facebook event URL must be a valid URL."
  }),
  linkedin_event_url: Joi.string().uri().optional().messages({
    "string.uri": "LinkedIn event URL must be a valid URL."
  }),
  twitter_event_url: Joi.string().uri().optional().messages({
    "string.uri": "Twitter event URL must be a valid URL."
  }),
  instagram_event_url: Joi.string().uri().optional().messages({
    "string.uri": "Instagram event URL must be a valid URL."
  }),
  featured_image: Joi.string().optional(),
  event_tags: Joi.array().items(Joi.string()).optional(),
  event_status: Joi.string().valid('draft', 'published', 'cancelled', 'completed').optional(),
  selected_form_id: Joi.string().optional(),
  ticketId: Joi.string().optional(),
  company_id : Joi.string().optional()
}).custom((obj, helpers) => {
  // Ensure either legacy date fields or dateRanges are provided
  const hasLegacyDates = obj.startDate && obj.startTime && obj.endDate && obj.endTime;
  const hasDateRanges = obj.dateRanges;
  
  if (!hasLegacyDates && !hasDateRanges) {
    return helpers.error('dates.required');
  }
  
  return obj;
}).messages({
  'dates.required': 'Either startDate/startTime/endDate/endTime or dateRanges must be provided.'
});

// Update validation for Event Host
export const eventHostUpdateSchema = Joi.object({
  event_id: Joi.string().required().messages({
    "any.required": "Event ID is required.",
    "string.base": "Event ID must be a string."
  }),
  eventName: Joi.string().required().messages({
    "any.required": "Event Name is required.",
    "string.base": "Event Name must be a string."
  }),
  eventShortName: Joi.string().required().messages({
    "any.required": "Event Short Name is required.",
    "string.base": "Event Short Name must be a string."
  }),
  eventTimeZone: Joi.string().required().messages({
    "any.required": "Time Zone is required.",
    "string.base": "Time Zone must be a string."
  }),
  startDate: Joi.string().optional().messages({
    "string.base": "Start Date must be a string."
  }),
  startTime: Joi.string().optional().messages({
    "string.base": "Start Time must be a string."
  }),
  endDate: Joi.string().optional().messages({
    "string.base": "End Date must be a string."
  }),
  endTime: Joi.string().optional().messages({
    "string.base": "End Time must be a string."
  }),
  dateRanges: Joi.string().optional().custom((value, helpers) => {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        return helpers.error('dateRanges.array');
      }
      for (const range of parsed) {
        if (!range.startDate || !range.startTime || !range.endDate || !range.endTime) {
          return helpers.error('dateRanges.missing');
        }
      }
      return value;
    } catch (error) {
      return helpers.error('dateRanges.invalid');
    }
  }).messages({
    "dateRanges.array": "Date ranges must be an array.",
    "dateRanges.missing": "Each date range must have startDate, startTime, endDate, and endTime.",
    "dateRanges.invalid": "Date ranges must be valid JSON."
  }),
  location: Joi.string().optional(),
  eventCategory: Joi.array()
    .items(
      Joi.string().required().messages({
        "any.required": "Each Event Category is required.",
        "string.base": "Each Event Category must be a string."
      })
    )
    .required()
    .messages({
      "any.required": "Event Category is required.",
      "array.base": "Event Category must be an array of strings."
    }),
  
  // Optional event detail fields (from integrated form)
  company_name: Joi.string().optional(),
  event_description: Joi.string().optional(),
  event_slug: Joi.string().optional(),
  google_map_url: Joi.string().uri().optional().messages({
    "string.uri": "Google Maps URL must be a valid URL."
  }),
  event_type: Joi.string().optional(),
  eventType: Joi.string().optional(),
  organizer_name: Joi.string().optional(),
  organizer_email: Joi.string().email().optional().messages({
    "string.email": "Organizer email must be a valid email address."
  }),
  organizer_phone: Joi.string().optional(),
  with_face_scanner: Joi.number().integer().min(0).max(1).optional(),
  show_location_image: Joi.string().optional(),
  event_sponsor: Joi.string().optional(),
  start_date: Joi.array().items(Joi.string()).optional(),
  end_date: Joi.array().items(Joi.string()).optional(),
  event_website: Joi.string().uri().optional().messages({
    "string.uri": "Event website must be a valid URL."
  }),
  event_image: Joi.string().optional(),
  event_logo: Joi.string().optional(),
  event_banner_image: Joi.string().optional(),
  facebook_event_url: Joi.string().uri().optional().messages({
    "string.uri": "Facebook event URL must be a valid URL."
  }),
  linkedin_event_url: Joi.string().uri().optional().messages({
    "string.uri": "LinkedIn event URL must be a valid URL."
  }),
  twitter_event_url: Joi.string().uri().optional().messages({
    "string.uri": "Twitter event URL must be a valid URL."
  }),
  instagram_event_url: Joi.string().uri().optional().messages({
    "string.uri": "Instagram event URL must be a valid URL."
  }),
  featured_image: Joi.string().optional(),
  event_tags: Joi.array().items(Joi.string()).optional(),
  event_status: Joi.string().valid('draft', 'published', 'cancelled', 'completed').optional(),
  ticketId: Joi.string().optional(),
  company_id: Joi.string().optional()
}).custom((obj, helpers) => {
  // Ensure either legacy date fields or dateRanges are provided
  const hasLegacyDates = obj.startDate && obj.startTime && obj.endDate && obj.endTime;
  const hasDateRanges = obj.dateRanges;
  
  if (!hasLegacyDates && !hasDateRanges) {
    return helpers.error('dates.required');
  }
  
  return obj;
}).messages({
  'dates.required': 'Either startDate/startTime/endDate/endTime or dateRanges must be provided.'
});
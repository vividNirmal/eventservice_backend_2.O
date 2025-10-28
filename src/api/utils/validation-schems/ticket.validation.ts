import Joi from 'joi';

// For dateSlab type
const dateSlabSchema = Joi.object({
    startDateTime: Joi.date().required(),
    endDateTime: Joi.date().required().greater(Joi.ref("startDateTime")),
    amount: Joi.number().min(0).required(),
});

// For businessSlab type
const businessSlabCategoryAmountSchema = Joi.object({
    category: Joi.string().trim().required(),
    amount: Joi.number().min(0).required(),
});

const businessSlabSchema = Joi.object({
    startDateTime: Joi.date().required(),
    endDateTime: Joi.date().required().greater(Joi.ref("startDateTime")),
    categoryAmounts: Joi.array()
        .items(businessSlabCategoryAmountSchema)
        .min(1)
        .required(),
});

const ticketAmountSchema = Joi.object({
    type: Joi.string().valid("free", "dateSlab", "businessSlab").required(),

    // Only required if not free
    currency: Joi.when("type", {
        is: Joi.valid("dateSlab", "businessSlab"),
        then: Joi.string()
        .valid("USD", "INR", "EUR", "GBP", "AUD", "CAD", "SGD", "AED")
        .required(),
        otherwise: Joi.forbidden(),
    }),

    // Required when type is dateSlab
    dateRangeAmounts: Joi.when("type", {
        is: "dateSlab",
        then: Joi.alternatives().try(
        Joi.array().items(dateSlabSchema).min(1).required(),
        Joi.string() // if stringified
        ),
        otherwise: Joi.forbidden(),
    }),

    // Required when type is businessSlab
    businessSlabs: Joi.when("type", {
        is: "businessSlab",
        then: Joi.alternatives().try(
        Joi.array().items(businessSlabSchema).min(1).required(),
        Joi.string()
        ),
        otherwise: Joi.forbidden(),
    }),

    feeSetting: Joi.string().valid("merge", "not-merge").default("merge"),
    materialNumber: Joi.string().trim().max(50).optional().allow(null, ""),
    wbs: Joi.string().trim().max(50).optional().allow(null, ""),
});

const advancedSettingsSchema = Joi.object({
    ticketBuyLimitMin: Joi.number().integer().min(1).default(1),
    ticketBuyLimitMax: Joi.number().integer().min(Joi.ref('ticketBuyLimitMin')).default(10),
    hasQuantityLimit: Joi.boolean().default(false),
    badgeCategory: Joi.string().trim().max(50).optional(),
    registrationFilterDate: Joi.date().optional().allow(null),
    allowCrossRegister: Joi.boolean().default(false),
    crossRegisterCategories: Joi.array().items(Joi.string()).when('allowCrossRegister', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    autoApprovedUser: Joi.boolean().default(false),
    authenticateByOTP: Joi.boolean().default(false),
    autoPassword: Joi.boolean().default(false),
    addAllDiscount: Joi.boolean().default(false),
    individualDiscount: Joi.boolean().default(false),
    registrationSuccessMessage: Joi.string().optional()
});

const notificationTemplateSchema = Joi.object({
    typeId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    templateId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    actionType: Joi.string().trim().required(),
    isCustom: Joi.boolean().default(false),
    templateRef: Joi.string().valid('Template', 'UserTemplate').optional()
});

const notificationDetailSchema = Joi.object({
    enabled: Joi.boolean().default(false),
    templates: Joi.array().items(notificationTemplateSchema).default([])
});

const notificationsSchema = Joi.object({
    emailNotification: notificationDetailSchema.default(),
    smsNotification: notificationDetailSchema.default(),
    whatsappNotification: notificationDetailSchema.default()
});

export const createTicketSchema = Joi.object({
    // Basic Info - Step 1
    ticketName: Joi.string().trim().min(1).max(100).required(),
    userType: Joi.string().required(),
    registrationFormId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    ticketCategory: Joi.string().valid('Default', 'VIP', 'VVIP', 'Premium', 'Standard').required(),
    serialNoPrefix: Joi.string().trim().min(1).max(20).required(),
    startCount: Joi.alternatives().try(Joi.number(), Joi.string()).optional().default(0),
    description: Joi.string().trim().max(500).optional(),

    // Ticket Amount - Step 2
    ticketAmount: Joi.alternatives().try(
        ticketAmountSchema, // object
        Joi.string()        // if sending FormData
    ).required(),

    // Ticket Settings - Step 3
    ticketPerUser: Joi.number().integer().min(1).default(1),
    ticketAccess: Joi.string().valid('Open For All', 'Invitation Only', 'Pre-Approved').default('Open For All'),
    linkBannerDesktop: Joi.string().uri().optional().allow(null,''),
    linkBannerMobile: Joi.string().uri().optional().allow(null,''),
    linkLoginBanner :Joi.string().uri().optional().allow(null,''),
    desktopBannerImage: Joi.string().optional().allow(null,''),
    mobileBannerImage: Joi.string().optional().allow(null,''),
    loginBannerImage :Joi.string().optional().allow(null,''),
    ctaSettings: Joi.array().items(Joi.string()).optional(),

    // Advanced Settings - Step 4
    advancedSettings: Joi.alternatives().try(
        advancedSettingsSchema, // object
        Joi.string()            // JSON string from FormData
    ).required(),

    // Notifications - Step 5
    notifications: Joi.alternatives().try(
        notificationsSchema, // object
        Joi.string()         // JSON string from FormData
    ).required(),

    // System fields
    status: Joi.string().valid('active', 'inactive', 'expired').default('active'),
    companyId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    eventId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
});

export const updateTicketBodySchema = Joi.object({
    // Basic Info
    ticketName: Joi.string().trim().min(1).max(100).optional(),
    userType: Joi.string().optional(),
    registrationFormId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    ticketCategory: Joi.string().valid('Default', 'VIP', 'VVIP', 'Premium', 'Standard').optional(),
    serialNoPrefix: Joi.string().trim().min(1).max(20).optional(),
    startCount: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
    description: Joi.string().trim().max(500).optional(),

    // Ticket Amount
    ticketAmount: Joi.alternatives().try(
        ticketAmountSchema, // object
        Joi.string()            // JSON string from FormData
    ).optional(),

    // Ticket Settings
    ticketPerUser: Joi.number().integer().min(1).optional(),
    ticketAccess: Joi.string().valid('Open For All', 'Invitation Only', 'Pre-Approved').optional(),
    linkBannerDesktop: Joi.string().uri().optional().allow(null,''),
    linkBannerMobile: Joi.string().uri().optional().allow(null,''),
    linkLoginBanner :Joi.string().uri().optional().allow(null,''),
    desktopBannerImage: Joi.string().optional().allow(null,''),
    mobileBannerImage: Joi.string().optional().allow(null,''),
    loginBannerImage :Joi.string().optional().allow(null,''),
    ctaSettings: Joi.array().items(Joi.string()).optional(),

    // Advanced Settings
    advancedSettings: Joi.alternatives().try(
        advancedSettingsSchema, // object
        Joi.string()            // JSON string from FormData
    ).optional(),

    // Notifications
    notifications: Joi.alternatives().try(
        notificationsSchema, // object
        Joi.string()         // JSON string from FormData
    ).optional(),

    // System fields
    status: Joi.string().valid('active', 'inactive', 'expired').optional(),
    companyId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    eventId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    isActiveForm: Joi.boolean().optional()
});

export const updateTicketSchema = Joi.object({
    params: Joi.object({
        id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    }),
    body: updateTicketBodySchema
});

export const deleteTicketSchema = Joi.object({
    params: Joi.object({
        id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    })
});

export const getTicketByIdSchema = Joi.object({
    params: Joi.object({
        id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    })
});

export const getTicketsQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    userType: Joi.string().optional(),
    ticketCategory: Joi.string().valid('Default', 'VIP', 'VVIP', 'Premium', 'Standard').optional(),
    status: Joi.string().valid('active', 'inactive', 'expired').optional(),
    search: Joi.string().trim().max(100).optional()
});

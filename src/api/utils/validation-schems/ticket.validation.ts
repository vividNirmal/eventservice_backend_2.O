import Joi from 'joi';

const slotAmountSchema = Joi.object({
    startDateTime: Joi.date().required(),
    endDateTime: Joi.date().required().greater(Joi.ref('startDateTime')),
    amount: Joi.number().min(0).required()
});

export const createTicketSchema = Joi.object({
    // Basic Info - Step 1
    ticketName: Joi.string().trim().min(1).max(100).required(),
    userType: Joi.string().valid(
        'Event Attendee', 
        'Exhibiting Company', 
        'Sponsor', 
        'Speaker', 
        'Service Provider', 
        'Accompanying'
    ).required(),
    registrationFormId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    ticketCategory: Joi.string().valid('Default', 'VIP', 'VVIP', 'Premium', 'Standard').required(),
    serialNoPrefix: Joi.string().trim().min(1).max(20).required(),
    startCount: Joi.alternatives().try(Joi.number(), Joi.string()).optional().default(0),
    description: Joi.string().trim().max(500).optional(),

    // Ticket Amount - Step 2
    isFree: Joi.boolean().required(),
    currency: Joi.when('isFree', {
        is: false,
        then: Joi.string().valid('USD', 'INR', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED').required(),
        otherwise: Joi.optional()
    }),
    slotAmounts: Joi.when('isFree', {
        is: false,
        then: Joi.alternatives().try(
            Joi.array().items(slotAmountSchema).min(1),
            Joi.string() // Allow string for FormData
        ),
        otherwise: Joi.optional()
    }),
    feeSetting: Joi.when('isFree', {
        is: false,
        then: Joi.string().valid('merge', 'not-merge').required(),
        otherwise: Joi.optional()
    }),
    materialNumber: Joi.string().trim().max(50).optional().allow(null,''),
    wbs: Joi.string().trim().max(50).optional().allow(null,''),

    // Ticket Settings - Step 3
    ticketPerUser: Joi.number().integer().min(1).default(1),
    ticketAccess: Joi.string().valid('Open For All', 'Invitation Only', 'Pre-Approved').default('Open For All'),
    linkBannerDesktop: Joi.string().uri().optional().allow(null,''),
    linkBannerMobile: Joi.string().uri().optional().allow(null,''),
    desktopBannerImage: Joi.string().optional().allow(null,''),
    mobileBannerImage: Joi.string().optional().allow(null,''),

    // Advanced Settings - Step 4
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

    // Notifications - Step 5
    emailNotification: Joi.boolean().default(false),
    smsNotification: Joi.boolean().default(false),
    whatsappNotification: Joi.boolean().default(false),

    // System fields
    status: Joi.string().valid('active', 'inactive', 'expired').default('active'),
    companyId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    eventId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
});

export const updateTicketBodySchema = Joi.object({
    // Basic Info
    ticketName: Joi.string().trim().min(1).max(100).optional(),
    userType: Joi.string().valid(
        'Event Attendee', 
        'Exhibiting Company', 
        'Sponsor', 
        'Speaker', 
        'Service Provider', 
        'Accompanying'
    ).optional(),
    registrationFormId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    ticketCategory: Joi.string().valid('Default', 'VIP', 'VVIP', 'Premium', 'Standard').optional(),
    serialNoPrefix: Joi.string().trim().min(1).max(20).optional(),
    startCount: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
    description: Joi.string().trim().max(500).optional(),

    // Ticket Amount
    isFree: Joi.boolean().optional(),
    currency: Joi.string().valid('USD', 'INR', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED').optional(),
    slotAmounts: Joi.alternatives().try(
        Joi.array().items(slotAmountSchema),
        Joi.string() // Allow string for FormData
    ).optional(),
    feeSetting: Joi.string().valid('merge', 'not-merge').optional(),
    materialNumber: Joi.string().trim().max(50).optional().allow(null,''),
    wbs: Joi.string().trim().max(50).optional().allow(null,''),

    // Ticket Settings
    ticketPerUser: Joi.number().integer().min(1).optional(),
    ticketAccess: Joi.string().valid('Open For All', 'Invitation Only', 'Pre-Approved').optional(),
    linkBannerDesktop: Joi.string().uri().optional().allow(null,''),
    linkBannerMobile: Joi.string().uri().optional().allow(null,''),
    desktopBannerImage: Joi.string().optional().allow(null,''),
    mobileBannerImage: Joi.string().optional().allow(null,''),

    // Advanced Settings
    ticketBuyLimitMin: Joi.number().integer().min(1).optional(),
    ticketBuyLimitMax: Joi.number().integer().min(1).optional(),
    hasQuantityLimit: Joi.boolean().optional(),
    badgeCategory: Joi.string().trim().max(50).optional(),
    registrationFilterDate: Joi.date().optional(),
    allowCrossRegister: Joi.boolean().optional(),
    crossRegisterCategories: Joi.array().items(Joi.string()).optional(),
    autoApprovedUser: Joi.boolean().optional(),
    authenticateByOTP: Joi.boolean().optional(),
    autoPassword: Joi.boolean().optional(),
    addAllDiscount: Joi.boolean().optional(),
    individualDiscount: Joi.boolean().optional(),

    // Notifications
    emailNotification: Joi.boolean().optional(),
    smsNotification: Joi.boolean().optional(),
    whatsappNotification: Joi.boolean().optional(),

    // System fields
    status: Joi.string().valid('active', 'inactive', 'expired').optional(),
    companyId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    eventId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional()
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
    userType: Joi.string().valid(
        'Event Attendee', 
        'Exhibiting Company', 
        'Sponsor', 
        'Speaker', 
        'Service Provider', 
        'Accompanying'
    ).optional(),
    ticketCategory: Joi.string().valid('Default', 'VIP', 'VVIP', 'Premium', 'Standard').optional(),
    status: Joi.string().valid('active', 'inactive', 'expired').optional(),
    search: Joi.string().trim().max(100).optional()
});

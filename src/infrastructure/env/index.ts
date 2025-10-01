import dotenv from 'dotenv'

dotenv.config()

// export env constant

export const env = {
    MONGO_URI: process.env.MONGO_URI,

    HOST: process.env.HOST,
    APP_PORT: process.env.PORT,

    NODE_ENV: process.env.NODE_ENV,
    SMTP_USER: process.env.EMAIL_USER,
    SMTP_PASS: process.env.EMAIL_PASS,
    SMTP_HOST: process.env.EMAIL_HOST,
    SMTP_PORT: process.env.EMAIL_PORT,
    SMTP_SECURE: process.env.EMAIL_SECURE,
    SMTP_FROM: process.env.EMAIL_FROM,

    IMAGES_PATH: process.env.IMAGES_PATH,

    // Agora details
    APP_ID: process.env.APP_ID,
    APP_CERTIFICATE: process.env.APP_CERTIFICATE,

    FIREBASE_CREDENTIALS: process.env.FIREBASE_CREDENTIALS,
    ENCRYPT_KEY :process.env.ENCRYPT_KEY,
    DECRYPT_KEY:process.env.DECRYPT_KEY,
    BASE_URL: process.env.BASE_URL,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
    AWS_REKOGNITION_COLLECTION: process.env.AWS_REKOGNITION_COLLECTION,
    AWS_API_VERSION: process.env.AWS_API_VERSION,
    // SITE_TITLE: process.env.SITE_TITLE,
    // APP_URL: process.env.APP_URL,

    // TIMEZONE: process.env.TIMEZONE || 'Asia/Kolkata',

    // SESSION_TIMEOUT_PRODUCTION: process.env.SESSION_TIMEOUT_PRODUCTION,
    // SESSION_TIMEOUT_STAGING: process.env.SESSION_TIMEOUT_STAGING,

    // REAL_ESTATE_API_URL: process.env.REAL_ESTATE_API_URL,
    // REAL_ESTATE_MLS_URL: process.env.REAL_ESTATE_MLS_URL,

    // REAL_ESTATE_API_KEY_STAGING: process.env.REAL_ESTATE_API_KEY_STAGING,
    // REAL_ESTATE_API_KEY_PRODUCTION: process.env.REAL_ESTATE_API_KEY_PRODUCTION,

    // SMTP_HOST: process.env.SMTP_HOST,
    // SMTP_PORT: process.env.SMTP_PORT,
    // SMTP_USER: process.env.SMTP_USER,
    // SMTP_PASS: process.env.SMTP_PASS,

    // EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    // DEFAULT_EMAIL_FROM: process.env.DEFAULT_EMAIL_FROM,

    // SEND_EMAIL_NOTIFY: process.env.SEND_EMAIL_NOTIFY,
    // EMAIL_NOTIFICATION_STATUS: process.env.EMAIL_NOTIFICATION_STATUS,
    // EMAIL_SEND_TO_DEFAULT_EMAIL: process.env.EMAIL_SEND_TO_DEFAULT_EMAIL,

    // GOOGLE_PLACE_API_KEY: process.env.GOOGLE_PLACE_API_KEY,

    // STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    // AUTH_MIDDLEWARE_TOKEN: process.env.AUTH_MIDDLEWARE_TOKEN
}
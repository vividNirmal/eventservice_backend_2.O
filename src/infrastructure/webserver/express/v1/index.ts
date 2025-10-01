import express from 'express';
import bodyParser from 'body-parser';
import rateLimit from "express-rate-limit";
import http from 'http';
import cors from 'cors';
import cookieParser from "cookie-parser";
import {createRouter} from "./routes";
import {env} from '../../../env';
import retry from 'retry';
import {initCronJobs} from "../../../../api/cron";
import connectDB from '../../../../api/config/db';
// import { setupSwagger } from '../../../../swagger';
import swaggerFile from "../../../../swagger-output.json"
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import { initDemoSocketHandlers } from '../../../../api/socket/initDemoSocketHandlers';
import path from "path";
import serveIndex from "serve-index"
import { loggerMsg } from '../../../../api/lib/logger';
/**
 * Creates an Express server with the necessary configurations and middleware.
 * The server listens on the specified port and host.
 *
 * @returns {void}
 */

let io: Server | any = null;

// Export the socket.IO instance
export const getIo = () => {
    if(!io){
        throw new Error("Socket.IO not initialized!")
    }
    return io;
}

// Socket.IO logic
export const onlineUsers = new Map<string, string>();

export const createServer = (): void => {
    // Create the Express app
    const app = express();

    // Get configuration values
    const port = env.APP_PORT || 3000;

    // Create an HTTP server explicitly
    const server = http.createServer(app);

    // Initialize Socket.IO with the server
    io = new Server(server, {
        cors: {
            origin: "*",    // Adjust as per your needs
            methods: ["GET", "POST"]
        }
    });


    const host = env.HOST;

    const limiter = rateLimit({
        windowMs: 60 * 1000, // 1 minutes
        max: 60, // Limit each IP to 60 requests per windowMs
        message: {
            status: 0,
            message: 'Too many requests, please try again later.'
        }
    });

    // app.use(limiter);

    

    // Middleware setup
    app.use(bodyParser.json({limit: '50mb'})); // JSON body parser
    app.use(bodyParser.urlencoded({limit: '50mb', extended: true})); // URL-encoded body parser

    app.use(cookieParser());
    app.use(cors({
        origin: true, // Allow all origins
        optionsSuccessStatus: 200,
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Date', 'X-Api-Version', 'X-File-Name', 'X-CSRF-Token'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    }));

    app.use((req, res, next) => {
        if (env.NODE_ENV == "development") {
            // Log every HTTP request
            // console.log(req.originalUrl, 'info');
            // console.log(req.body, 'info');
            // console.log(req.headers, 'info');
        }

        // Additional CORS headers for compatibility
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

        if (req.method === 'OPTIONS') {
            res.status(200).end();
        } else {
            next();
        }
    });

    app.get("/",(req,res) => {
        res.send(`<h1 style="color: green;">Server Running</h1>`)
    })
    app.use("/api", createRouter());

    // setupSwagger(app)
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
    console.log(__dirname);
    app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
    
    initCronJobs();

    // initSocketHandlers(io)
    app.set('socketio',io);
    initDemoSocketHandlers(io)

    const logsPath = path.join(__dirname, "../../../../../logs");
    loggerMsg(`logs path...\n${logsPath}`,"debug")
    const imagePath = path.resolve(__dirname,String(env.IMAGES_PATH));
    loggerMsg(`image path...\n${imagePath}`,"debug");
    
    app.use('/logs', express.static(logsPath), serveIndex(logsPath, { icons: true }));
    app.use('/images', express.static(imagePath), serveIndex(imagePath, { icons: true }));

    app.get("/chat-app", (req, res) => {
        res.sendFile(path.join(__dirname, "../../../../public/index.html"))
    })

    // Initialize the database connection with retry mechanism
    const maxRetries = 3;
    let connectionInitialized = false;

    const operation = retry.operation({retries: maxRetries});

    function initializeAppDataSource(currentAttempt: number) {
        if (connectionInitialized) {
            return;
        }

        if (currentAttempt <= maxRetries) {
            try {
                connectDB().then(() => {
                    server.listen(port, () => {
                        console.info(`Server listening on http://localhost:${port}`);
                    });
                })
                .catch((error:any) => {
                        console.error(`Database Connection Failed (Attempt ${currentAttempt} of ${maxRetries}):`, error);
                        setTimeout(() => initializeAppDataSource(currentAttempt + 1), 1000); // Retry after 1 second
                })
                // server.listen(port, () => {
                //     console.info(`Server listening on http://localhost:${port}`);
                // });
                    
            } catch (error: any) {
                console.error(`Database Connection Failed (Attempt ${currentAttempt} of ${maxRetries}):`, error);
                setTimeout(() => initializeAppDataSource(currentAttempt + 1), 1000); // Retry after 1 second
            }
        } else {
            console.error('Max retries reached. Database Connection Failed.');
        }
    }

    // Use the retry library to initialize the database connection
    operation.attempt((currentAttempt: number) => {
        initializeAppDataSource(currentAttempt);
    });

}

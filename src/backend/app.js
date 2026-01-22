
import express from "express";
import mongoose from "mongoose";

import cors from "cors";
import { createServer } from "node:http";
import { connectToSocket } from "./controllers/socketManager.js";
import router from "./route/usersRoutes.js";

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This ensures the path is always absolute to app.js
dotenv.config({ path: path.join(__dirname, ".env") });



const app = express();


/*
http.createServer() is a built-in method used to initialize an HTTP server. 
It turns your computer into a server capable of listening for network requests from clients (like browsers) and sending back responses. 
*/
const server = createServer(app);
//=======to avoid writing code in same file for express and socket.io used this function that is imported from ./controllers/socketManager.js========== 
const io = connectToSocket(server);
//=============here setting port as pre environment variable or port no.: 3000==============
app.set("port", (process.env.PORT || 3000))

//========to resolve cors issue  =====================
app.use(cors());
app.use(express.urlencoded({limit:"40kb",extended:true}))
app.use(express.json({limit:"40kb"}))
/*
The limit parameter controls the maximum size of incoming request bodies. 
If a client sends a request with a body larger than 40KB, 
Express will reject it with a "request entity too large" error (HTTP 413 status code). 
By default, Express uses a limit of 100KB when no limit is specified.
*/

app.use("/api/v1/user",router);
//==========for stroing MongUrl=============================
app.set("MongoURL", (process.env.MONGO_URL ) )
async function main() {

    await mongoose.connect(app.get("MongoURL"));
    
}

main()
    .then(
        () =>{ 
            console.log("Connected to Database"),
        // ✅ 4.
        // You must define all middleware and routes BEFORE starting the server.
        //  START SERVER (Must be last)
        // Only start listening after DB matches and routes are ready
        server.listen(app.get("port"), () => {
            console.log("Server listening on port 3000");
        });
    }

)
    .catch(err => console.log(err));

//==========error handeling middleware=====================

    app.use((err, req, res, next) => {
        console.error("Error Stack:========================\n", err.stack); // Log for debugging
        
        
        const statusCode = err.status || 500;
        const message = err.message || "Internal Server Error";
    
        return res.status(statusCode).json({
            success: false,
            message: message,
            // Only show stack in development
            stack: process.env.NODE_ENV === 'development' ? err.stack : {}
        });
    });
    

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


dotenv.config({ path: path.join(__dirname, ".env") });



const app = express();


const server = createServer(app);

const io = connectToSocket(server);

app.set("port", (process.env.PORT || 3000))

app.use(cors());
app.use(express.urlencoded({limit:"40kb",extended:true}))
app.use(express.json({limit:"40kb"}))


app.use("/api/v1/user",router);

app.set("MongoURL", (process.env.MONGO_URL ) )
async function main() {

    await mongoose.connect(app.get("MongoURL"));
    
}

main()
    .then(
        () =>{ 
            console.log("Connected to Database"),

        server.listen(app.get("port"), () => {
            console.log("Server listening on port 3000");
        });
    }

)
    .catch(err => console.log(err));



    app.use((err, req, res, next) => {
        console.error("Error Stack:========================\n", err.stack); 
        
        
        const statusCode = err.status || 500;
        const message = err.message || "Internal Server Error";
    
        return res.status(statusCode).json({
            success: false,
            message: message,
     
            stack: process.env.NODE_ENV === 'development' ? err.stack : {}
        });
    });
    
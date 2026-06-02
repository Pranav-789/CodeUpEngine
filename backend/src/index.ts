import express, {json, NextFunction, Request, Response} from "express"
import "dotenv/config"
import cors from "cors"
import cookieParser from "cookie-parser";
import {ApiError} from "./utils/ApiError.js";
import connectDB from "./db/index.js";
import AuthRouter from "./routes/auth.routes.js";
import RecommendationRouter from "./routes/recommendation.route.js";
import UserRouter from "./routes/user.routes.js";
import rateLimit from "express-rate-limit";
import { syncCodeforcesProfile } from "./controllers/user.controller.js";
import { requireAuth } from "./middlewares/auth.middlewares.js";

// Initialize workers
import "./workers/recommendation.worker.js";

const app = express();

app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }
));

app.use(express.json({limit: "16Kb"}));

app.use(express.urlencoded({extended: true, limit: "16Kb"}));

app.use(cookieParser());

const PORT = process.env.PORT || 5000

app.get("/", (req: Request, res: Response)=> {
    return res.json({"message": "The server is live"});
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100,
    message: "Too many requests from this IP, please try again after an hour"
});

app.use("/api/v1/auth", authLimiter, AuthRouter)
app.use("/api/v1/recommendations", RecommendationRouter)
app.use("/api/v1/user", UserRouter)
app.post("/api/v1/sync", requireAuth, syncCodeforcesProfile)

app.use((err: ApiError, req: Request, res: Response, next: NextFunction)=> {
    console.error("Global Error Handler caught:", err);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message,
        errors: err.errors
    });
});

connectDB().then(()=>
    {
        app.listen(PORT, ()=> console.log(`Server is listening on PORT ${PORT}`));
    }
).catch((err)=>{
    console.log("MongoDB connection failerd", err);
})
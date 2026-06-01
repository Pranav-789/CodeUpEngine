import {Request, Response, NextFunction} from "express"
import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js";

declare global{
    namespace Express {
        interface Request {
            user?: {
                userId: string,
                role: string
            };
        }
    }
}

interface accessHeader {
    userId: string,
    role: string
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]

    if(!token){
        throw new ApiError(401, "Unauthorized: No token provided");
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as accessHeader;

        req.user = decoded;

        next();
    } catch (error) {
        throw new ApiError(403, "Forbidden: Token is invalid or expired");
    }
}

export const requireRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if(!req.user){
            throw new ApiError(401, "Unauthorized: User context missing");
        }

        if(!allowedRoles.includes(req.user.role)){
            throw new ApiError(403, 'Forbidden: Insufficient permissions');
        }

        next();
    }
}
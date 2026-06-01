import {Request, Response, NextFunction} from "express"
import { ApiError } from "./ApiError.js";

type AsyncFunction = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<any>;

const asyncHandler = (fn: AsyncFunction) =>{
    return (req: Request, res: Response, next: NextFunction)=>{
        Promise.resolve(fn(req, res, next)).catch((err)=>next(err));
    }
}

const asyncTryHandler = (fn: AsyncFunction) => async(req: Request, res: Response, next: NextFunction)=>{
    try{
        await fn(req, res, next);
    }catch(error){
        if(error instanceof ApiError){
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message,
                errors: error.errors
            })
        }
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export {asyncHandler, asyncTryHandler};
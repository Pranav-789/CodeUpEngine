import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandlers.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.model.js"
import Session from "../models/session.model.js"
import bcrypt from "bcrypt"
import { sendPasswordResetEmail, sendVerificationEmail, sendResetPasswordConfirmationEmail } from "../utils/mailer.js";
import { generateAccessToken, generateForgotPasswordToken, generateRefreshToken, generateVerifyEmailToken } from "../utils/tokenGenerator.js";
import jwt from "jsonwebtoken"
import { v4 as uuidv4 } from "uuid";

export const register = asyncHandler(async(req: Request, res: Response) => {
    const {codeforcesHandle, email, password} = req.body;

    if(!codeforcesHandle || !email || !password){
        throw new ApiError(400, "Codeforces Handle, email, password are required for registering");
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({
        $or: [
            {email: normalizedEmail},
            {codeforcesHandle: codeforcesHandle}
        ]
    });

    if(existingUser){
        throw new ApiError(409, "The user already exists");
    }

    // Verify codeforces handle before registration
    const userInfoResponse = await fetch(
        `https://codeforces.com/api/user.info?handles=${codeforcesHandle}`
    );

    if(!userInfoResponse.ok){
        throw new ApiError(404, "User not found on codeforces");
    }

    const userInfoData = await userInfoResponse.json() as any;

    if (userInfoData?.status !== "OK" || !userInfoData.result || userInfoData.result.length === 0) {
        throw new ApiError(404, "Invalid Codeforces handle");
    }

    const cfUser = userInfoData.result[0];

    if (cfUser.handle.toLowerCase() !== codeforcesHandle.toLowerCase()) {
        throw new ApiError(403, "Codeforces handle mismatch");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
        email: normalizedEmail,
        codeforcesHandle: codeforcesHandle,
        passwordHash: hashedPassword,
        role: "user",
        nextWeeklyRefresh: new Date(Date.now() + 7*24*60*60*1000),
    });

    const createdUser = await User.findById(newUser._id).select(
        "-passwordHash -subscriptionTier -premiumTokens"
    );

    if (!createdUser) {
        throw new ApiError(500, "Failed to fetch created user");
    }

    const verifyEmailToken = generateVerifyEmailToken(createdUser._id.toString());
    newUser.emailVerificationToken = verifyEmailToken;
    newUser.emailVerificationExpiry = new Date(Date.now() + 5*60*1000);

    await newUser.save();    

    const result = await sendVerificationEmail(createdUser.email, verifyEmailToken, createdUser.codeforcesHandle);

    if(!result){
        await User.findByIdAndDelete(createdUser._id);
        throw new ApiError(500, "Failed to send verification email, please try again");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully, please verify your email")
    );
});

export const verifyEmail = asyncHandler(async(req: Request, res: Response) => {
    const {token} = req.params; 

    if(!token){
        throw new ApiError(400, "Token is required for verification");
    }

    try {
        const decodedToken = jwt.verify(token as string, process.env.VERIFY_EMAIL_TOKEN_SECRET as string) as unknown as {userId: string};
        const user = await User.findById(decodedToken.userId);

        if(!user){
            throw new ApiError(404, "User not found");
        }

        if(user.isVerified){
            throw new ApiError(400, "User is already verified");
        }

        user.isVerified = true;

        await user.save();

        return res.status(200).json(
            new ApiResponse(200, {}, "Email verified successfully")
        );
    } catch (error) {
        throw new ApiError(401, "Invalid verification token");
    }
});

export const login = asyncHandler(async(req: Request, res: Response) => {
    const {email, password} = req.body;

    if(!email || !password){
        throw new ApiError(400, "Email and password are required for logging in");
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({
        email: normalizedEmail,
    });

    if(!user){
        throw new ApiError(401, "Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid email or password");
    }

    if(!user.isVerified){
        throw new ApiError(403, "Please verify your email before logging in");
    }
    
    const accessToken = generateAccessToken({userId: user._id.toString(), role: user.role});
    const refreshToken = generateRefreshToken({userId: user._id.toString(), role: user.role});
    
    const deviceId = uuidv4();

    const newSession = await Session.create({
        userId: user._id,
        deviceId: deviceId,
        refreshToken: refreshToken,
        expiresAt: new Date(Date.now() + 7*24*60*60*1000),
    });

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 10*60*60*1000,
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7*24*60*60*1000,
    });

    return res.status(200).json(
        new ApiResponse(200, {sessionId: newSession._id}, "User logged in successfully")
    );
});

export const forgotPasswordRequest = asyncHandler(async(req: Request, res: Response) => {
    const {email} = req.body;

    if(!email){
        throw new ApiError(400, "Email is required for forgot password request");
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({
        email: normalizedEmail,
    });

    if(!user){
        throw new ApiError(404, "User not found");
    }

    const forgotPasswordToken = generateForgotPasswordToken(user._id.toString());
    user.forgotPasswordToken = forgotPasswordToken;
    user.forgotPasswordExpiry = new Date(Date.now() + 5*60*1000);

    await user.save();

    const result = await sendPasswordResetEmail(user.email, forgotPasswordToken, user.codeforcesHandle);

    if(!result){
        throw new ApiError(500, "Failed to send forgot password email, please try again");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Forgot password email sent successfully")
    );
});

export const confirmResetPassword = asyncHandler(async(req: Request, res: Response) => {
    const {token} = req.params;
    const {newPassword} = req.body;

    if(!token || !newPassword){
        throw new ApiError(400, "Token and password are required for resetting password");
    }

    try {
        const decodedToken = jwt.verify(token as string, process.env.FORGOT_PASSWORD_TOKEN_SECRET as string) as unknown as {userId: string};
        const user = await User.findById(decodedToken.userId);

        if(!user){
            throw new ApiError(404, "User not found");
        }

        if(!user.forgotPasswordToken || user.forgotPasswordToken !== token){
            throw new ApiError(400, "Invalid forgot password token");
        }

        if(user.forgotPasswordExpiry! < new Date()){
            throw new ApiError(400, "Forgot password token has expired");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.passwordHash = hashedPassword;
        user.forgotPasswordToken = undefined;
        user.forgotPasswordExpiry = undefined;

        await user.save();

        await sendResetPasswordConfirmationEmail(user.email, user.codeforcesHandle);

        return res.status(200).json(
            new ApiResponse(200, {}, "Password reset successfully")
        );
    } catch (error) {
        console.error("DEBUG ERROR in confirmResetPassword:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        throw new ApiError(401, "Invalid forgot password token: " + message);
    }
})

export const logout = asyncHandler(async(req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;

    if(refreshToken){
        const session = await Session.findOne({ refreshToken });
        if(session){
            await session.deleteOne();
        }
    }

    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
    });

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
    });

    return res.status(200).json(
        new ApiResponse(200, {}, "User logged out successfully")
    );
})

export const refreshAccessToken = asyncHandler(async(req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;

    if(!refreshToken){
        throw new ApiError(401, "Refresh token is missing");
    }

    try {
        const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as unknown as {userId: string};
        const user = await User.findById(decodedToken.userId);

        if(!user){
            throw new ApiError(404, "User not found");
        }

        const accessToken = generateAccessToken({userId: user._id.toString(), role: user.role});
        const newRefreshToken = generateRefreshToken({userId: user._id.toString(), role: user.role});

        const session = await Session.findOneAndUpdate(
            {userId: user._id, refreshToken: refreshToken},
            {refreshToken: newRefreshToken},
            {new: true}
        );

        if(!session){
            throw new ApiError(404, "Session not found");
        }

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 10*60*60*1000,
        });

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7*24*60*60*1000,
        });

        return res.status(200).json(
            new ApiResponse(200, {}, "Access token refreshed successfully")
        );
    } catch (error) {
        throw new ApiError(401, "Invalid or expired refresh token");
    }
})

export const resetPassword = asyncHandler(async(req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;

    if(!oldPassword || !newPassword){
        throw new ApiError(400, "Old password and new password are required");
    }

    const user = await User.findById(req.user?.userId);

    if(!user){
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid old password");
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashedNewPassword;
    
    await user.save();

    return res.status(200).json(
        new ApiResponse(200, {}, "Password reset successfully")
    );
})

export const updateCodeforcesHandle = asyncHandler(async(req: Request, res: Response) => {
    const { codeforcesHandle } = req.body;

    if(!codeforcesHandle){
        throw new ApiError(400, "Codeforces Handle is required");
    }

    const userId = req.user?.userId;
    if(!userId){
        throw new ApiError(401, "Unauthorized");
    }

    // Check if the handle is already used by someone else
    const existingUser = await User.findOne({
        codeforcesHandle: codeforcesHandle,
        _id: { $ne: userId }
    });

    if(existingUser){
        throw new ApiError(409, "Codeforces Handle is already taken");
    }

    // Verify codeforces handle before updating
    const userInfoResponse = await fetch(
        `https://codeforces.com/api/user.info?handles=${codeforcesHandle}`
    );

    if(!userInfoResponse.ok){
        throw new ApiError(404, "User not found on codeforces");
    }

    const userInfoData = await userInfoResponse.json() as any;

    if (userInfoData?.status !== "OK" || !userInfoData.result || userInfoData.result.length === 0) {
        throw new ApiError(404, "Invalid Codeforces handle");
    }

    const cfUser = userInfoData.result[0];

    if (cfUser.handle.toLowerCase() !== codeforcesHandle.toLowerCase()) {
        throw new ApiError(403, "Codeforces handle mismatch");
    }

    const user = await User.findById(userId);

    if(!user){
        throw new ApiError(404, "User not found");
    }

    user.codeforcesHandle = codeforcesHandle;
    await user.save();

    return res.status(200).json(
        new ApiResponse(200, {}, "Codeforces Handle updated successfully")
    );
});

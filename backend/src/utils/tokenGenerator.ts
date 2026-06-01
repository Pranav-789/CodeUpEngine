import jwt, {Secret, SignOptions, JwtPayload} from "jsonwebtoken"

const generateAccessToken = ({userId, role}: {userId: string, role: string}) => {
    const payload: JwtPayload = {
        userId: userId,
        userRole: role
    }   

    const options: SignOptions = {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"]
    }

    return jwt.sign(
        payload,
        process.env.ACCESS_TOKEN_SECRET as Secret,
        options
    )
}   

const generateRefreshToken = ({userId, role}: {userId: string, role: string}) => {
    const payload: JwtPayload = {
        userId: userId,
        userRole: role
    }   

    const options: SignOptions = {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY as SignOptions["expiresIn"]
    }

    return jwt.sign(
        payload,
        process.env.REFRESH_TOKEN_SECRET as Secret,
        options
    )
}   

const generateVerifyEmailToken = (userId: string) => {
    const payload: JwtPayload = {
        userId: userId,
    }   

    const options: SignOptions = {
        expiresIn: process.env.VERIFY_EMAIL_TOKEN_EXPIRY as SignOptions["expiresIn"]
    }

    return jwt.sign(
        payload,
        process.env.VERIFY_EMAIL_TOKEN_SECRET as Secret,
        options
    )
}   

const generateForgotPasswordToken = (userId: string) => {
    const payload: JwtPayload = {
        userId: userId,
    }   

    const options: SignOptions = {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRY as SignOptions["expiresIn"]
    }

    return jwt.sign(
        payload,
        process.env.FORGOT_PASSWORD_TOKEN_SECRET as Secret,
        options
    )
}  

export {
    generateAccessToken,
    generateRefreshToken,
    generateVerifyEmailToken,
    generateForgotPasswordToken
};
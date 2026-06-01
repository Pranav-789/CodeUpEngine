import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST as string,
    port: Number(process.env.SMTP_PORT),
    auth: {
        user: process.env.SMTP_USER as string,
        pass: process.env.SMTP_PASSWORD as string
    }
})


const genVerifyEmailMail = (email: string, token: string, username: string) => {
    const verificationUrl = `${process.env.BACKEND_BASE_URL}/api/v1/auth/verify-email/${token}`;
    
    return {
        from: `"CodeUpEngine" <${process.env.SMTP_USER as string}>`,
        to: email,
        subject: "Verify your email address",
        text: `Hello ${username}, \n\nPlease click the link below to verify your email address: \n\n${verificationUrl}\n\nThank you!`,
        html: `
            <p>Hello ${username},</p>
            <p>Please click the link below to verify your email address:</p>
            <p><a href="${verificationUrl}">Verify your email address</a></p>
            <p>Thank you!</p>
        `
    }
}

export const sendVerificationEmail = (email: string, token: string, username: string) => {
    const mailOptions = genVerifyEmailMail(email, token, username);
    return transporter.sendMail(mailOptions);
}

const genPasswordResetMail = (email: string, token: string, username: string) => {
    const resetUrl = `${process.env.BACKEND_BASE_URL}/api/v1/auth/confirm-reset-password/${token}`;
    
    return {
        from: `"CodeUpEngine" <${process.env.SMTP_USER as string}>`,
        to: email,
        subject: "Reset your password",
        text: `Hello ${username}, \n\nPlease click the link below to reset your password: \n\n${resetUrl}\n\nThank you!`,
        html: `
            <p>Hello ${username},</p>
            <p>Please click the link below to reset your password:</p>
            <p><a href="${resetUrl}">Reset your password</a></p>
            <p>Thank you!</p>
        `
    }
}

export const sendPasswordResetEmail = (email: string, token: string, username: string) => {
    const mailOptions = genPasswordResetMail(email, token, username);
    return transporter.sendMail(mailOptions);
}

const genResetPasswordConfirmationMail = (email: string, username: string) => {
    return {
        from: `"CodeUpEngine" <${process.env.SMTP_USER as string}>`,
        to: email,
        subject: "Password Reset Confirmation",
        text: `Hello ${username},\n\nYour password has been reset successfully.\n\nThank you!`,
        html: `
            <p>Hello ${username},</p>
            <p>Your password has been reset successfully.</p>
            <p>Thank you!</p>
        `
    }
}

export const sendResetPasswordConfirmationEmail = (email: string, username: string) => {
    const mailOptions = genResetPasswordConfirmationMail(email, username);
    return transporter.sendMail(mailOptions);
}

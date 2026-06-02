import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST as string,
    port: Number(process.env.SMTP_PORT),
    auth: {
        user: process.env.SMTP_USER as string,
        pass: process.env.SMTP_PASSWORD as string
    }
});

const getEmailTemplate = (title: string, username: string, message: string, buttonText?: string, buttonUrl?: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #09090b;
            color: #fafafa;
            margin: 0;
            padding: 40px 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #18181b;
            border: 1px solid #27272a;
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
        }
        .header {
            text-align: center;
            margin-bottom: 32px;
        }
        .logo {
            font-size: 24px;
            font-weight: 700;
            color: #8b5cf6;
            text-decoration: none;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        .content {
            font-size: 16px;
            line-height: 1.6;
            color: #a1a1aa;
        }
        .content h1 {
            color: #fafafa;
            font-size: 20px;
            margin-top: 0;
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        .button {
            display: inline-block;
            background-color: #8b5cf6;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
        }
        .footer {
            text-align: center;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #27272a;
            font-size: 14px;
            color: #71717a;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">CodeUpEngine</div>
        </div>
        <div class="content">
            <h1>${title}</h1>
            <p>Hello ${username},</p>
            <p>${message}</p>
            ${buttonText && buttonUrl ? `
            <div class="button-container">
                <a href="${buttonUrl}" class="button">${buttonText}</a>
            </div>
            ` : ''}
            <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} CodeUpEngine. All rights reserved.
        </div>
    </div>
</body>
</html>
`;

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const genVerifyEmailMail = (email: string, token: string, username: string) => {
    const verificationUrl = `${FRONTEND_URL}/verify-email/${token}`;
    
    return {
        from: `"CodeUpEngine" <${process.env.SMTP_USER as string}>`,
        to: email,
        subject: "Verify your email address",
        text: `Hello ${username}, \n\nPlease click the link below to verify your email address: \n\n${verificationUrl}\n\nThank you!`,
        html: getEmailTemplate(
            "Verify Your Email",
            username,
            "Welcome to CodeUpEngine! Please verify your email address to get started.",
            "Verify Email",
            verificationUrl
        )
    }
}

export const sendVerificationEmail = (email: string, token: string, username: string) => {
    const mailOptions = genVerifyEmailMail(email, token, username);
    return transporter.sendMail(mailOptions);
}

const genPasswordResetMail = (email: string, token: string, username: string) => {
    const resetUrl = `${FRONTEND_URL}/reset-password/${token}`;
    
    return {
        from: `"CodeUpEngine" <${process.env.SMTP_USER as string}>`,
        to: email,
        subject: "Reset your password",
        text: `Hello ${username}, \n\nPlease click the link below to reset your password: \n\n${resetUrl}\n\nThank you!`,
        html: getEmailTemplate(
            "Reset Your Password",
            username,
            "We received a request to reset your password. Click the button below to choose a new one.",
            "Reset Password",
            resetUrl
        )
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
        html: getEmailTemplate(
            "Password Reset Successful",
            username,
            "Your password has been successfully reset. You can now log in with your new password.",
            "Go to Login",
            `${FRONTEND_URL}/login`
        )
    }
}

export const sendResetPasswordConfirmationEmail = (email: string, username: string) => {
    const mailOptions = genResetPasswordConfirmationMail(email, username);
    return transporter.sendMail(mailOptions);
}

import nodemailer from "nodemailer";
import dns from "node:dns/promises";

async function testMail() {
    try {
        console.log("Resolving IPv4 for smtp.gmail.com...");
        const addresses = await dns.resolve4("smtp.gmail.com");
        const ipv4 = addresses[0];
        console.log("Resolved IPv4:", ipv4);

        const transporter = nodemailer.createTransport({
            host: ipv4,
            port: 465,
            secure: true,
            auth: {
                user: "[EMAIL_ADDRESS]",
                pass: "xyz"
            },
            tls: {
                servername: "smtp.gmail.com",
                rejectUnauthorized: true,
            }
        });

        console.log("Verifying connection...");
        await transporter.verify();
        console.log("Server is ready to take our messages");
    } catch (error) {
        console.error("Error occurred:", error);
    }
}

testMail();

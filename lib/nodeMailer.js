import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();


const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com", 
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL, 
    pass: process.env.SMTP_KEY, 
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    // Send the email
    const info = await transporter.sendMail({
      from: `"ShortiFy" <${process.env.SENDER}>`, // Sender’s email dynamically
      to, // Recipient's email
      subject, // Subject
      html, // HTML content
    });

    const testEmailURL = nodemailer.getTestMessageUrl(info);
    console.log("Email sent successfully. Message ID:", info.messageId);
  } catch (error) {
    console.error("Error sending email: ", error);
  }
};



const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { User, Profile } = require('../models');
const yup = require('yup');
const { sign } = require('jsonwebtoken');
require('dotenv').config();
const { validateToken } = require('../middlewares/auth');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer')


//   Validation schema
let registerSchema = yup.object({
    name: yup.string().trim().min(3).max(50).required("Name is required")
        .matches(/^[a-zA-Z '-,.]+$/,
            "name only allow letters, spaces and characters: ' - , ."),

    email: yup.string().trim().lowercase().email().max(50).required("Email is required"),

    password: yup.string().trim().min(8).max(50).required("Password is required")
        .matches(/^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/,
            "password at least 1 letter and 1 number"),

    confirmPassword: yup.string()
        .oneOf([yup.ref('password'), null], 'Passwords must match')
        .required('Confirm password is required')
});

const loginSchema = yup.object({
    email: yup.string().trim().lowercase().email().max(50).required("Email is required"),
    password: yup.string().trim().min(8).max(50).required("Password is required")
        .matches(/^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/,
            "password at least 1 letter and 1 number")
});

const profileUpdateSchema = yup.object({
    name: yup.string().trim().min(3).max(50).required("Name is required")
        .matches(/^[a-zA-Z '-,.]+$/,
            "name only allow letters, spaces and characters: ' - , ."),
    mobile: yup.string().min(8).max(15).required("Mobile is required")
        .matches(/^\+?[0-9]{8,15}$/, 'Please enter a valid mobile number')
});

//Email verification
// Configure email transporter for sending verification emails
const emailTransporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});


// Function to send verification email to user
async function sendVerificationEmail(email, token) {
    // Create verification URL for the frontend to handle
    const verificationUrl = `http://localhost:3001/user/verify-email/${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: email,
        subject: 'Email Verification',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4a5568;">Welcome to Our Platform!</h1>
          <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
          <div style="margin: 25px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #4299e1; color: white; padding: 10px 20px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verify Email
            </a>
          </div>
          <p>If you did not create an account, no further action is required.</p>
          <p>This link will expire in 24 hours.</p>
          <hr style="border: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #718096; font-size: 0.875rem;">
            If you're having trouble clicking the button, copy and paste the URL below into your web browser:
          </p>
          <p style="color: #4a5568; word-break: break-all;">
            ${verificationUrl}
          </p>
        </div>
      `
    };

    try {
        await emailTransporter.sendMail(mailOptions);
        console.log('Verification email sent to:', email);
        return true;
    } catch (error) {
        console.error('Email sending error:', error);
        return false;
    }
}

//CRUD API functions
//Register Create Function
router.post("/register", async (req, res) => {
    let data = req.body;

    try {
        //Validate Request body
        data = await registerSchema.validate(data, { abortEarly: false });

        // Process valid data 
        // Check email exists
        let user = await User.findOne({
            where: { email: data.email }
        });
        if (user) {
            res.status(400).json({ message: "Email already exists." });
            return;
        }

        // Hash passowrd
        const salt = await bcrypt.genSalt(10);
        data.password = await bcrypt.hash(data.password, salt);

        // Generate verification token for email verification
        const verificationToken = uuidv4();

        // Create user
        const result = await User.create({
            name: data.name,
            email: data.email,
            password: data.password,
            mobile: data.mobile,
            verification_token: verificationToken
        });

        //Create profile
        await Profile.create({
            user_id: result.id,
            name: result.name,
            email: result.email,
            mobile: result.mobile
        })

        // Send verification email
        await sendVerificationEmail(data.email, verificationToken);

        res.status(201).json({
            message: 'User registered successfully. Please verify your email.'
        });

    }
    catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: "Error registering user", err });
    }

});

//Todo: middlewares to insert verify-email
//verifyEmail Read function
router.get("/verify-email/:token", async (req, res) => {
    try {
        const { token } = req.params;

        // Process valid data 
        let user = await User.findOne({ where: { verification_token: token } });
        if (!user) {
            res.status(400).json({ message: "Invalid verification token" });
            return;
        }
        // Update user to set email as verified and remove verification token
        await User.update(
            { email_verified: true, verification_token: null },
            { where: { id: user.id } }
        );

        res.status(200).json({ message: "Email verified successfully. You can now log in." });

    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({ message: "Server error during verification" });
    }
});

//Login create function
router.post("/login", async (req, res) => {
    let data = req.body;

    //Validate Request body
    try {
        data = await loginSchema.validate(data, { abortEarly: false });

        //check email and password
        let errorMsg = "Email or password is not correct.";
        let user = await User.findOne({ where: { email: data.email } });

        //user email error sequence
        if (!user) { return res.status(400).json({ message: errorMsg }); }
        if (!user.email_verified) { return res.status(403).json({ message: "Please verify your email before logging in." }); }

        //user password error sequence
        let match = await bcrypt.compare(data.password, user.password);
        if (!match) { return res.status(400).json({ message: errorMsg }); }

        //Return user info, user.email.password matched
        let userInfo = { id: user.id, email: user.email, name: user.name };

        // JWT token and successful login
        let accessToken = sign(userInfo, process.env.JWT_SECRET, { expiresIn: process.env.TOKEN_EXPIRES_IN || "1d" });
        res.status(200).json({ message: "Login Successful", accessToken: accessToken, user: userInfo });

    }
    catch (err) {
        res.status(400).json({ errors: err.errors });
    }
}
);

//validate Token
router.get("/auth", validateToken, (req, res) => {
    let userInfo = { id: req.user.id, email: req.user.email, name: req.user.name };
    res.json({ user: userInfo });
});

module.exports = router;

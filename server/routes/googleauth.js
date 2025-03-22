const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const db = require('../models');

const router = express.Router();
const User = db.User;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;

        // Verify Google ID token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        // Get user details from decoded token
        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        // Check if user exists in database
        let user = await User.findOne({ where: { email } });

        if (!user) {
            // Create a new user
            user = await User.create({
                email,
                name,
                google_id: googleId,
                profile_picture: picture,
                password: null,
                auth_method: 'google',
                email_verified: true
            });

            // Create a profile if necessary
            await db.Profile.create({
                user_id: user.id,
                name: user.name,
                email: user.email
            });
        } else if (!user.google_id) {
            // Link Google account if it's not already linked
            await user.update({
                google_id: googleId,
                auth_method: user.auth_method || 'email',
                profile_picture: user.profile_picture || picture
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                profile_picture: user.profile_picture || picture
            }
        });
    } catch (error) {
        console.error('Google authentication error:', error);
        res.status(401).json({ success: false, message: 'Invalid Google token' });
    }
});

module.exports = router;

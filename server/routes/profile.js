const express = require("express");
const router = express.Router();
const { validateToken } = require("../middlewares/auth");
const multer = require("multer");
const { User, Profile } = require('../models');
const yup = require('yup');
const path = require('path');
const fs = require('fs');


const profileUpdateSchema = yup.object({
    name: yup.string().trim().min(3).max(50).required("Name is required")
        .matches(/^[a-zA-Z '-,.]+$/,
            "name only allow letters, spaces and characters: ' - , ."),
    mobile: yup.string().min(8).max(15).required("Mobile is required")
        .matches(/^\+?[0-9]{8,15}$/, 'Please enter a valid mobile number')
});

//Get user Profile
router.get("/", validateToken, async (req, res) => {
    try {
        // Find user profile using Sequelize
        const userProfile = await Profile.findOne({
            where: { user_id: req.user.id }
        });

        if (!userProfile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        const userInfo = {
            id: userProfile.user_id,
            name: userProfile.name,
            email: userProfile.email,
            mobileNumber: userProfile.mobile,
            profilePicture: userProfile.profile_picture
                ? `${req.protocol}://${req.get('host')}/uploads/profile-pictures/${userProfile.profile_picture}`
                : null
        };

        res.status(200).json({ user: userInfo });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error while fetching profile' });
    }
});

//Update user Profile
router.put("/", validateToken, async (req, res) => {
    let data = req.body;

    try {
        // Validate request body
        data = await profileUpdateSchema.validate(data, { abortEarly: false });
        // Find user profile using Sequelize
        const userProfile = await Profile.findOne({ where: { user_id: req.user.id } });
        if (!userProfile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        const { name, mobile } = req.body;

        // Check if the profile data has changed
        const isChanged =
            userProfile.name !== name ||
            userProfile.mobile !== mobile;

        if (!isChanged) {
            return res.status(404).json({ message: 'No changes made' });
        }

        //Update user profile using sequelize
        const updatedRows = await userProfile.update({
            name: name,
            mobile: mobile
        });

        //No row updated to profile
        if (updatedRows === 0) {
            return res.status(404).json({ message: 'No changes made' });
        }

        // Find the updated profile data
        const updatedProfile = await Profile.findOne({ where: { user_id: req.user.id } });

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                user: {
                    id: updatedProfile.user_id,
                    name: updatedProfile.name,
                    mobile: updatedProfile.mobile,
                    profilePicture: updatedProfile.profile_picture
                        ? `${req.protocol}://${req.get('host')}/uploads/profile-pictures/${updatedProfile.profile_picture}`
                        : null
                }
            }

        });

    } catch (err) {
        console.error('Update profile error:', err);
        res.status(400).json({ errors: err.errors });
    }
});

// Configure multer storage for profile pictures
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Define upload directory and create it if it doesn't exist
        const uploadDir = './uploads/profile-pictures';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create unique filename with timestamp to prevent overwriting
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Create multer upload instance with file filtering
const upload = multer({
    storage, limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: (req, file, cb) => {
        // Only allow image file types
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

router.post("/picture", validateToken, upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const userId = req.user.id;
        const profilePicture = req.file.filename;

        // Fetch the current profile using Sequelize
        const userProfile = await Profile.findOne({ where: { user_id: userId } });

        if (!userProfile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // If there is an old profile picture, delete it
        if (userProfile.profile_picture) {
            const oldPicturePath = path.join(__dirname, 'uploads', 'profile-pictures', userProfile.profile_picture);
            if (fs.existsSync(oldPicturePath)) {
                fs.unlinkSync(oldPicturePath);
            }
        }

        // Update profile with new picture using Sequelize
        await userProfile.update({ profile_picture: profilePicture });

        res.status(200).json({
            message: 'Profile picture uploaded successfully',
            profilePicture: `${req.protocol}://${req.get('host')}/uploads/profile-pictures/${profilePicture}`
        });

    } catch (error) {
        console.error('Profile picture upload error:', error);
        res.status(500).json({ message: 'Server error while uploading profile picture' });
    }
});


module.exports = router;

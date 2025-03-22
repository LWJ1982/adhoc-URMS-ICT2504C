const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());

// Enable CORS
app.use(cors({
    origin: process.env.CLIENT_URL
}));

// // Simple Route
// app.get("/", (req, res) => {
//     res.send("Welcome to the learning space.");
// });

// Root route for API health check
app.get("/", (req, res) => {
    res.json({ message: "Address API is running" });
  });

// Routes
const addressRoutes = require('./routes/address');
app.use("/address", addressRoutes);
const userRoute = require('./routes/user');
app.use("/user",userRoute);
const profileRoute = require('./routes/profile');
app.use("/profile",profileRoute);

const db = require('./models');
db.sequelize.sync({ alter: true })
    .then(() => {
        let port = process.env.APP_PORT;
        app.listen(port, () => {
            console.log(`ദ്ദി(˵ •̀ ᴗ - ˵ )✧👍 Sever running on http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error("Failed to sync database:", err);
    });
require("dotenv").config({ quiet: true });
const path = require('path');
const express = require('express');
const cookieParser = require("cookie-parser");
const cors = require('cors');
const errorHandler = require('./middlewares/errorMiddleware');
const connectDB = require('./config/database');
const axios = require('axios')
const app = express();
const PORT = process.env.PORT || 5000;
connectDB();


// Middleware
app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));

app.use(
    cors({
        origin: ["http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: true,
    })
);


// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/participants', require('./routes/participantRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/chats', require('./routes/chatRoutes'));
app.use("/api/webhooks", require("./routes/webhookRoutes"));

app.use(errorHandler)

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Serve static files from the client/dist folder
app.use(express.static(path.join(__dirname, '/client/dist')));

// Catch-all route for React Router
app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
})

// Start server
app.listen(PORT, () => {
    console.log(`Server started on port http://localhost:${PORT}`);
});

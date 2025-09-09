const authModel = require('../models/authModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


// Signup controller
exports.signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await authModel.findOne({
            email: email.toLowerCase()
        });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new authModel({
            username: username,
            email: email.toLowerCase(),
            password: hashedPassword
        });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Signin controller
exports.signin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await authModel.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // save into cookies
        res.cookie("__Token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Lax",
            maxAge: 1 * 24 * 60 * 60 * 1000 // 1 day    
        });

        res.status(200).json({
            user,
            token,
            message: 'Signin successful'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}


exports.logout = async (req, res) => {
    try {
        res.clearCookie("__Token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Lax",
        });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        console.log("Fetching user profile...");
        const token = req.cookies.__Token;
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await authModel.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ user, token });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}




const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const SALT_ROUNDS = 10;

exports.register = async (req, res) => {
    try {
        const { username, email, password, fullName } = req.body;

        if (!username || !email || !password || !fullName) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const newUser = await User.create({
            username,
            email,
            passwordHash,
            fullName
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: newUser
        });

    } catch (err) {
        console.error(err);
        if (err.message === 'Username or Email already exists') {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Server error during registration' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during login' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching user profile' });
    }
}

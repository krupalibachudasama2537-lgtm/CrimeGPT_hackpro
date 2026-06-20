import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { offlineDb } from '../services/offlineStorage.js';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, name: user.name, role: user.role, badge: user.badge },
    process.env.JWT_SECRET || 'crimegpt_jwt_secret_token_123456789',
    { expiresIn: '24h' }
  );
};

export const register = async (req, res) => {
  const { username, name, email, badge, password, role } = req.body;

  if (!username || !name || !email || !badge || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const isOffline = mongoose.connection.readyState !== 1;
    let userExists;

    if (!isOffline) {
      // Check if username already exists in MongoDB
      userExists = await User.findOne({ $or: [{ username }, { badge }, { email }] });
    } else {
      // Check in offline database
      userExists = await offlineDb.users.findOne({ $or: [{ username }, { badge }, { email }] });
    }

    if (userExists) {
      return res.status(400).json({ message: 'User with this username, email, or badge already exists' });
    }

    let newUser;
    if (!isOffline) {
      newUser = new User({
        username,
        name,
        email,
        badge,
        password,
        role
      });
      await newUser.save();
    } else {
      newUser = await offlineDb.users.create({
        username,
        name,
        email,
        badge,
        password,
        role
      });
    }
    
    const token = generateToken(newUser);
    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        badge: newUser.badge
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const isOffline = mongoose.connection.readyState !== 1;
    let user;

    if (!isOffline) {
      // Find user by username or badge in MongoDB
      user = await User.findOne({ $or: [{ username }, { badge: username }] });
    } else {
      // Find in offline database
      user = await offlineDb.users.findOne({ $or: [{ username }, { badge: username }] });
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. User not found.' });
    }

    let isMatch = false;
    if (!isOffline) {
      isMatch = await user.comparePassword(password);
    } else {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials. Wrong password.' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        badge: user.badge
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const getMe = async (req, res) => {
  try {
    const isOffline = mongoose.connection.readyState !== 1;
    let user;

    if (!isOffline) {
      user = await User.findById(req.user.id).select('-password');
    } else {
      const rawUser = await offlineDb.users.findById(req.user.id);
      if (rawUser) {
        const { password, ...userWithoutPassword } = rawUser;
        user = userWithoutPassword;
      }
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
};

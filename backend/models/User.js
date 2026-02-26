// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  // New Profile Fields
  phone: {
    type: String,
    trim: true,
  },
  bio: {
    type: String,
    maxlength: 500,
    trim: true,
  },
  profilePhoto: {
    type: String,
    default: '',
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  dateOfBirth: {
    type: Date,
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    currency: {
      type: String,
      default: 'ETB',
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
    language: {
      type: String,
      default: 'en',
    },
  },
  // Social links - replaced with lifestyle-relevant platforms
  socialLinks: {
    whatsapp: { type: String, trim: true },
    telegram: { type: String, trim: true },
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
  },
  // Emergency contact
  emergencyContact: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    relationship: { type: String, trim: true },
  },
  // Money Personality Badge
  moneyPersonality: {
    type: String,
    enum: ['Smart Saver', 'Budget Hero', 'Money Mindful', 'Saver Star', 'Frugal Fighter', 'Budget Boss', 'None'],
    default: 'None',
  },
  // Financial Statistics
  financialStats: {
    monthlyBudget: { type: Number, default: 0 },
    savingsStreak: { type: Number, default: 0 }, // days
    financialGoal: { type: Number, default: 0 },
    goalProgress: { type: Number, default: 0 }, // percentage
  },
  // Lifestyle Preferences (categories user cares about)
  lifestylePreferences: {
    food: { type: Boolean, default: true },
    transport: { type: Boolean, default: true },
    rent: { type: Boolean, default: false },
    education: { type: Boolean, default: false },
    entertainment: { type: Boolean, default: true },
  },
  // Money Story / Bio
  moneyStory: {
    type: String,
    maxlength: 1000,
    trim: true,
  },
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password when converting to JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
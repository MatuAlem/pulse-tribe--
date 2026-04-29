// ===== models/User.js =====
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String, required: [true, 'Email is required'],
      unique: true, lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },

    // Body profile (from onboarding)
    profile: {
      weight:  { type: Number },           // kg
      height:  { type: Number },           // cm
      age:     { type: Number },
      gender:  { type: String, enum: ['Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other'] },
      goal:    { type: String, enum: ['Build Muscle', 'Lose Weight', 'Improve Endurance', 'General Fitness'] },
      medicalConditions: [{ type: String }],
      injuries:          [{ type: String }]
    },

    // Streak tracking
    streak: {
      current:  { type: Number, default: 0 },
      lastWorkout: { type: Date }
    },

    avatar: { type: String, default: '' },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT
UserSchema.methods.getSignedToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

module.exports = mongoose.model('User', UserSchema);

// ===== models/Workout.js =====
const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  sets:        { type: Number },
  reps:        { type: String },   // e.g. "8-12" or "15"
  duration:    { type: Number },   // in seconds, for cardio
  restSeconds: { type: Number, default: 60 },
  notes:       { type: String }
});

const WorkoutPlanSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title:       { type: String, required: true },
    description: { type: String },
    goal:        { type: String },
    difficulty:  { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    days: [
      {
        dayName:   { type: String },   // e.g. "Monday", "Day 1"
        focus:     { type: String },   // e.g. "Chest & Triceps"
        exercises: [ExerciseSchema]
      }
    ],
    isAIGenerated: { type: Boolean, default: false },
    approvedByTrainer: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// ── Workout Log (each completed session) ──────────────
const WorkoutLogSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan:      { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutPlan' },
    title:     { type: String, required: true },
    exercises: [
      {
        name:          { type: String },
        setsCompleted: { type: Number },
        repsCompleted: { type: String },
        weight:        { type: Number }   // kg
      }
    ],
    durationMinutes: { type: Number },
    caloriesBurned:  { type: Number },
    notes:           { type: String },
    completedAt:     { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const WorkoutPlan = mongoose.model('WorkoutPlan', WorkoutPlanSchema);
const WorkoutLog  = mongoose.model('WorkoutLog',  WorkoutLogSchema);

module.exports = { WorkoutPlan, WorkoutLog };

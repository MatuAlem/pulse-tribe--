// ===== models/Nutrition.js =====
const mongoose = require('mongoose');

// ── Meal Plan (AI generated daily plan) ──────────────
const MealPlanSchema = new mongoose.Schema(
  {
    user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    totalCalories: { type: Number },
    restrictions:  { type: String, default: 'none' },
    meals: [
      {
        mealType:    { type: String, enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'] },
        name:        { type: String },
        description: { type: String },
        calories:    { type: Number },
        protein:     { type: Number },  // g
        carbs:       { type: Number },  // g
        fat:         { type: Number }   // g
      }
    ],
    aiTip:         { type: String },
    isAIGenerated: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// ── Food Log (what user actually ate) ────────────────
const FoodLogSchema = new mongoose.Schema(
  {
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },  // e.g. "2 egg whites"
    calories:    { type: Number, required: true },
    protein:     { type: Number, default: 0 },
    carbs:       { type: Number, default: 0 },
    fat:         { type: Number, default: 0 },
    mealType:    { type: String, enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'], default: 'Snack' },
    loggedAt:    { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const MealPlan = mongoose.model('MealPlan', MealPlanSchema);
const FoodLog  = mongoose.model('FoodLog',  FoodLogSchema);

module.exports = { MealPlan, FoodLog };

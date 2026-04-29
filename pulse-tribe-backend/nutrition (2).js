// ===== routes/nutrition.js =====
const express = require('express');
const router  = express.Router();
const { MealPlan, FoodLog } = require('../models/Nutrition');
const { protect } = require('../middleware/auth');

router.use(protect);

// ── GET /api/nutrition/plans ─────────────────────────
// Get all meal plans for user (history)
router.get('/plans', async (req, res) => {
  try {
    const plans = await MealPlan.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/nutrition/plans/latest ─────────────────
// Get the most recent meal plan
router.get('/plans/latest', async (req, res) => {
  try {
    const plan = await MealPlan.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (!plan)
      return res.status(404).json({ success: false, message: 'No meal plan found. Generate one via AI.' });
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/nutrition/plans ────────────────────────
// Save a meal plan (usually called after AI generates it)
// Body: { totalCalories, restrictions, meals: [...], aiTip }
router.post('/plans', async (req, res) => {
  try {
    const plan = await MealPlan.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, plan });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/nutrition/plans/:id ─────────────────
router.delete('/plans/:id', async (req, res) => {
  try {
    await MealPlan.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Meal plan deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/nutrition/log ───────────────────────────
// Get today's food logs
router.get('/log', async (req, res) => {
  try {
    const { date } = req.query;
    let start, end;

    if (date) {
      start = new Date(date);
      end   = new Date(date);
    } else {
      start = new Date();
      end   = new Date();
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const logs = await FoodLog.find({
      user: req.user._id,
      loggedAt: { $gte: start, $lte: end }
    }).sort({ loggedAt: -1 });

    const totalCalories = logs.reduce((sum, l) => sum + l.calories, 0);
    const totalProtein  = logs.reduce((sum, l) => sum + l.protein, 0);
    const totalCarbs    = logs.reduce((sum, l) => sum + l.carbs, 0);
    const totalFat      = logs.reduce((sum, l) => sum + l.fat, 0);

    res.json({
      success: true,
      logs,
      totals: { calories: totalCalories, protein: totalProtein, carbs: totalCarbs, fat: totalFat }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/nutrition/log ──────────────────────────
// Log a food item (from the food chat feature)
// Body: { description, calories, protein, carbs, fat, mealType }
router.post('/log', async (req, res) => {
  try {
    const entry = await FoodLog.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, entry });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/nutrition/log/:id ───────────────────
router.delete('/log/:id', async (req, res) => {
  try {
    await FoodLog.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Food log entry deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/nutrition/weekly ────────────────────────
// Calorie summary for the past 7 days
router.get('/weekly', async (req, res) => {
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);

      const logs = await FoodLog.find({ user: req.user._id, loggedAt: { $gte: start, $lte: end } });
      const total = logs.reduce((sum, l) => sum + l.calories, 0);

      days.push({
        date: d.toISOString().split('T')[0],
        calories: total
      });
    }
    res.json({ success: true, weekly: days });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

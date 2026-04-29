// ===== routes/workouts.js =====
const express = require('express');
const router  = express.Router();
const { WorkoutPlan, WorkoutLog } = require('../models/Workout');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// ── GET /api/workouts/plans ──────────────────────────
// Get all workout plans for logged-in user
router.get('/plans', async (req, res) => {
  try {
    const plans = await WorkoutPlan.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: plans.length, plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/workouts/plans ─────────────────────────
// Create a new workout plan
router.post('/plans', async (req, res) => {
  try {
    const plan = await WorkoutPlan.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, plan });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── GET /api/workouts/plans/:id ──────────────────────
router.get('/plans/:id', async (req, res) => {
  try {
    const plan = await WorkoutPlan.findOne({ _id: req.params.id, user: req.user._id });
    if (!plan)
      return res.status(404).json({ success: false, message: 'Workout plan not found' });
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/workouts/plans/:id ──────────────────────
router.put('/plans/:id', async (req, res) => {
  try {
    const plan = await WorkoutPlan.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!plan)
      return res.status(404).json({ success: false, message: 'Workout plan not found' });
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/workouts/plans/:id ──────────────────
router.delete('/plans/:id', async (req, res) => {
  try {
    const plan = await WorkoutPlan.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!plan)
      return res.status(404).json({ success: false, message: 'Workout plan not found' });
    res.json({ success: true, message: 'Workout plan deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/workouts/log ───────────────────────────
// Log a completed workout session + update streak
router.post('/log', async (req, res) => {
  try {
    const log = await WorkoutLog.create({ ...req.body, user: req.user._id });

    // Update streak
    const user = await User.findById(req.user._id);
    const now  = new Date();
    const last = user.streak.lastWorkout;

    if (last) {
      const diffHours = (now - last) / (1000 * 60 * 60);
      if (diffHours >= 20 && diffHours <= 32) {
        // Consecutive day
        user.streak.current += 1;
      } else if (diffHours > 32) {
        // Streak broken
        user.streak.current = 1;
      }
    } else {
      user.streak.current = 1;
    }

    user.streak.lastWorkout = now;
    await user.save();

    res.status(201).json({ success: true, log, streak: user.streak });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── GET /api/workouts/log ────────────────────────────
// Get workout history for the user
router.get('/log', async (req, res) => {
  try {
    const logs = await WorkoutLog.find({ user: req.user._id })
      .sort({ completedAt: -1 })
      .limit(50);
    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/workouts/stats ──────────────────────────
// Progress snapshot: consistency, streak, total workouts
router.get('/stats', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Workouts this week (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyLogs = await WorkoutLog.countDocuments({
      user: req.user._id,
      completedAt: { $gte: weekAgo }
    });

    const totalLogs = await WorkoutLog.countDocuments({ user: req.user._id });
    const consistency = Math.round((weeklyLogs / 7) * 100);

    res.json({
      success: true,
      stats: {
        streak:      user.streak.current,
        lastWorkout: user.streak.lastWorkout,
        consistency,
        weeklyCount: weeklyLogs,
        totalWorkouts: totalLogs
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

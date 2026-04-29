// ===== routes/ai.js =====
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');

router.use(protect);

// ── Helper: call Anthropic API ───────────────────────
async function callClaude(systemPrompt, userMessage) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'AI API error');
  return data.content[0].text;
}

// ── POST /api/ai/chat ────────────────────────────────
// General AI fitness assistant chat
// Body: { message, conversationHistory: [{role, content}] }
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    const user = req.user;

    const systemPrompt = `You are a professional AI fitness trainer for Pulse Tribe, an Ethiopian fitness app.
The user's profile: weight=${user.profile?.weight || 'unknown'}kg, height=${user.profile?.height || 'unknown'}cm, 
age=${user.profile?.age || 'unknown'}, goal="${user.profile?.goal || 'General Fitness'}".
Give personalized, practical, motivating fitness and nutrition advice. Keep responses concise and friendly.
Use 🔥 and 💪 emojis occasionally to match the brand tone.`;

    // Build messages with history
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'AI API error');

    res.json({ success: true, reply: data.content[0].text });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/ai/meal-plan ───────────────────────────
// Generate a personalized meal plan and save it
router.post('/meal-plan', async (req, res) => {
  try {
    const user = req.user;
    const { restrictions = 'none' } = req.body;

    const prompt = `Generate a daily meal plan for a person with these details:
- Goal: ${user.profile?.goal || 'General Fitness'}
- Weight: ${user.profile?.weight || 70}kg
- Height: ${user.profile?.height || 175}cm
- Age: ${user.profile?.age || 25}
- Dietary restrictions: ${restrictions}

Respond ONLY with a valid JSON object (no markdown, no extra text):
{
  "totalCalories": number,
  "meals": [
    {
      "mealType": "Breakfast" | "Lunch" | "Dinner" | "Snack",
      "name": "Meal name",
      "description": "Ingredients and preparation",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    }
  ],
  "aiTip": "One personalized nutrition tip"
}`;

    const raw = await callClaude('You are a nutrition expert. Return only valid JSON.', prompt);

    let planData;
    try {
      planData = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      return res.status(500).json({ success: false, message: 'AI returned invalid format. Please try again.' });
    }

    // Save to DB
    const { MealPlan } = require('../models/Nutrition');
    const plan = await MealPlan.create({
      user: req.user._id,
      ...planData,
      restrictions,
      isAIGenerated: true
    });

    res.status(201).json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/ai/workout-plan ────────────────────────
// Generate a personalized workout plan and save it
router.post('/workout-plan', async (req, res) => {
  try {
    const user = req.user;
    const { daysPerWeek = 3 } = req.body;

    const prompt = `Create a ${daysPerWeek}-day weekly workout plan for:
- Goal: ${user.profile?.goal || 'General Fitness'}
- Injuries: ${(user.profile?.injuries || []).join(', ') || 'none'}
- Medical conditions: ${(user.profile?.medicalConditions || []).join(', ') || 'none'}
- Experience level: Beginner

Respond ONLY with a valid JSON object (no markdown):
{
  "title": "Plan name",
  "description": "Brief overview",
  "goal": "${user.profile?.goal || 'General Fitness'}",
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "days": [
    {
      "dayName": "Day 1",
      "focus": "Muscle group focus",
      "exercises": [
        {
          "name": "Exercise name",
          "sets": number,
          "reps": "8-12",
          "restSeconds": 60,
          "notes": "Form tip"
        }
      ]
    }
  ]
}`;

    const raw = await callClaude('You are a certified personal trainer. Return only valid JSON.', prompt);

    let planData;
    try {
      planData = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      return res.status(500).json({ success: false, message: 'AI returned invalid format. Please try again.' });
    }

    const { WorkoutPlan } = require('../models/Workout');
    const plan = await WorkoutPlan.create({
      user: req.user._id,
      ...planData,
      isAIGenerated: true
    });

    res.status(201).json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/ai/log-food ────────────────────────────
// Parse food description and log calories (Food Chat feature)
// Body: { description }
router.post('/log-food', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description)
      return res.status(400).json({ success: false, message: 'Food description is required' });

    const prompt = `Analyze this food and estimate its nutritional content: "${description}"

Respond ONLY with valid JSON (no markdown):
{
  "items": [
    { "name": "food item", "calories": number, "protein": number, "carbs": number, "fat": number }
  ],
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFat": number,
  "summary": "Brief human-readable summary"
}`;

    const raw = await callClaude('You are a nutrition database. Return only valid JSON.', prompt);

    let result;
    try {
      result = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      return res.status(500).json({ success: false, message: 'Could not parse food info. Try being more specific.' });
    }

    // Save to FoodLog
    const { FoodLog } = require('../models/Nutrition');
    const entry = await FoodLog.create({
      user: req.user._id,
      description,
      calories: result.totalCalories,
      protein:  result.totalProtein,
      carbs:    result.totalCarbs,
      fat:      result.totalFat
    });

    res.status(201).json({ success: true, result, entry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/ai/progress-insight ───────────────────
// Generate an AI insight based on user's recent data
router.post('/progress-insight', async (req, res) => {
  try {
    const { streak, consistency, totalWorkouts } = req.body;
    const user = req.user;

    const prompt = `Give a short, motivating fitness insight (2-3 sentences) for a user with:
- Goal: ${user.profile?.goal || 'General Fitness'}
- Current streak: ${streak || 0} days
- Weekly consistency: ${consistency || 0}%
- Total workouts logged: ${totalWorkouts || 0}

Be encouraging but honest. Keep it under 50 words.`;

    const insight = await callClaude('You are a fitness coach. Be brief and motivating.', prompt);
    res.json({ success: true, insight });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

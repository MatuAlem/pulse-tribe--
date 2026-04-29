# 🔥 Pulse Tribe — Backend API

Node.js + Express + MongoDB REST API for the Pulse Tribe fitness web app.

---

## 📁 Project Structure

```
pulse-tribe-backend/
├── server.js              ← App entry point
├── package.json
├── .env.example           ← Copy to .env and fill in values
├── middleware/
│   └── auth.js            ← JWT protect middleware
├── models/
│   ├── User.js            ← User + onboarding profile
│   ├── Workout.js         ← WorkoutPlan + WorkoutLog
│   ├── Nutrition.js       ← MealPlan + FoodLog
│   ├── Post.js            ← Social Feed posts
│   └── Shop.js            ← Products + Orders
└── routes/
    ├── auth.js            ← Register, Login, Profile
    ├── workouts.js        ← Plans, Logs, Stats
    ├── nutrition.js       ← Meal Plans, Food Logs
    ├── feed.js            ← Posts, Likes, Comments, Follow
    ├── shop.js            ← Products, Orders
    └── ai.js              ← AI Chat, Meal/Workout generation
```

---

## ⚙️ Setup Instructions

### 1. Install dependencies
```bash
cd pulse-tribe-backend
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Then edit `.env` with your values:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/pulse_tribe
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRE=30d
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 3. Start MongoDB
Make sure MongoDB is running locally, or use a free cloud instance:
- **Local:** `mongod`
- **Cloud:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) → copy your connection string to `MONGO_URI`

### 4. Run the server
```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:5000`

---

## 🔌 API Endpoints

### 🔐 Auth — `/api/auth`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Create new account | ❌ |
| POST | `/login` | Login and get token | ❌ |
| GET | `/me` | Get current user | ✅ |
| PUT | `/profile` | Update onboarding profile | ✅ |
| PUT | `/password` | Change password | ✅ |

**Register example:**
```json
POST /api/auth/register
{
  "name": "Amanuel",
  "email": "amanuel@example.com",
  "password": "securepassword"
}
```

**Login response:**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": { "_id": "...", "name": "Amanuel", "email": "..." }
}
```

> Use the token in all protected requests:
> `Authorization: Bearer <token>`

---

### 💪 Workouts — `/api/workouts`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/plans` | Get all workout plans |
| POST | `/plans` | Create workout plan |
| GET | `/plans/:id` | Get single plan |
| PUT | `/plans/:id` | Update plan |
| DELETE | `/plans/:id` | Delete plan |
| POST | `/log` | Log completed workout |
| GET | `/log` | Get workout history |
| GET | `/stats` | Streak + consistency stats |

---

### 🥗 Nutrition — `/api/nutrition`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/plans` | Get meal plan history |
| GET | `/plans/latest` | Get today's active plan |
| POST | `/plans` | Save a meal plan |
| DELETE | `/plans/:id` | Delete a plan |
| GET | `/log` | Get today's food logs |
| POST | `/log` | Log a food item |
| DELETE | `/log/:id` | Delete a log entry |
| GET | `/weekly` | 7-day calorie summary |

---

### 🔥 Social Feed — `/api/feed`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all posts (paginated) |
| POST | `/` | Create a post |
| DELETE | `/:id` | Delete your post |
| POST | `/:id/like` | Like / unlike a post |
| POST | `/:id/comment` | Add comment |
| DELETE | `/:postId/comment/:commentId` | Delete comment |
| POST | `/follow/:userId` | Follow / unfollow user |

---

### 🛒 Shop — `/api/shop`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | Browse all products |
| GET | `/products/:id` | Single product |
| POST | `/products` | Add product (admin) |
| PUT | `/products/:id` | Update product (admin) |
| DELETE | `/products/:id` | Delete product (admin) |
| POST | `/orders` | Place an order |
| GET | `/orders` | My order history |
| GET | `/orders/:id` | Single order details |
| PUT | `/orders/:id/cancel` | Cancel pending order |

**Filter products:**
```
GET /api/shop/products?category=Supplements&sort=price_asc
GET /api/shop/products?search=creatine
```

---

### 🤖 AI — `/api/ai`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | AI fitness chat assistant |
| POST | `/meal-plan` | Generate + save AI meal plan |
| POST | `/workout-plan` | Generate + save AI workout plan |
| POST | `/log-food` | Parse food + log calories |
| POST | `/progress-insight` | Get AI motivation insight |

**Chat example:**
```json
POST /api/ai/chat
{
  "message": "What should I eat after a workout?",
  "conversationHistory": []
}
```

**Generate meal plan:**
```json
POST /api/ai/meal-plan
{
  "restrictions": "no pork"
}
```

**Log food via AI:**
```json
POST /api/ai/log-food
{
  "description": "2 egg whites and a banana"
}
```

---

## 🔗 Connecting Frontend to Backend

In your `script.js`, replace the mock functions with real API calls:

```javascript
const API = 'http://localhost:5000/api';
let token = localStorage.getItem('pt_token');

// Login
async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.success) {
    token = data.token;
    localStorage.setItem('pt_token', token);
  }
  return data;
}

// Authenticated request helper
async function apiCall(endpoint, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${endpoint}`, opts);
  return res.json();
}

// Examples
const feed    = await apiCall('/feed');
const aiReply = await apiCall('/ai/chat', 'POST', { message: 'How do I build muscle?' });
const plan    = await apiCall('/ai/meal-plan', 'POST', { restrictions: 'none' });
```

---

## 🌐 Deploying to Production

**Recommended free options:**
- **Backend:** [Railway](https://railway.app) or [Render](https://render.com)
- **Database:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier)
- **Frontend:** [Vercel](https://vercel.com) or [Netlify](https://netlify.com)

Just set your environment variables in the platform dashboard and deploy!

# GlobalBite 🌍🍽️

A production-ready full-stack recipe discovery app with a live-streaming Gemini AI Chef chatbot.

Built with **React + Vite + Tailwind CSS + Framer Motion** on the frontend and **Node.js + Express + MongoDB + Google Gemini** on the backend.

---

## Project Structure

```
globalbite/
├── backend/
│   ├── config/
│   │   └── db.js              # Mongoose connection with retry logic
│   ├── models/
│   │   └── Recipe.js          # Recipe schema with validation & indexes
│   ├── routes/
│   │   ├── chat.js            # Gemini SSE streaming endpoint
│   │   └── recipes.js         # CRUD for saved recipes
│   ├── server.js              # Express app (CORS, Helmet, Rate Limiting)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWidget.jsx  # Morphing AI chat with SSE stream parser
│   │   │   ├── RecipeCard.jsx  # Animated recipe card
│   │   │   └── RecipeGrid.jsx  # Staggered grid with save functionality
│   │   ├── App.jsx             # Main dashboard + search
│   │   ├── api.js              # Axios instance
│   │   ├── index.css           # Tailwind + custom base styles
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── package.json               # Monorepo root with concurrently
└── README.md
```

---

## Setup & Installation

### 1. Clone & install dependencies

```bash
# From project root
npm run install:all
```

### 2. Configure backend environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/globalbite
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

Get your Gemini API key at: https://aistudio.google.com/app/apikey

### 3. Configure frontend environment (optional)

```bash
cd frontend
```

Create `frontend/.env`:

```env
VITE_SPOONACULAR_KEY=your_spoonacular_key_here
```

Get a free Spoonacular API key at: https://spoonacular.com/food-api  
The app works without it — it falls back to demo mock data.

### 4. Run in development

```bash
# From project root (runs both backend and frontend)
npm run dev
```

- Frontend: http://localhost:5173  
- Backend API: http://localhost:5000/api

---

## Key Features

| Feature | Technology |
|---|---|
| Global recipe search | Spoonacular API |
| Staggered card animations | Framer Motion |
| Grid / list layout toggle | React state + Framer layoutId |
| Save favourite recipes | MongoDB / Mongoose |
| AI Chef chatbot | Google Gemini 2.5 Flash |
| Live token streaming | Server-Sent Events (SSE) |
| Morphing chat widget | Framer Motion spring physics |
| Rate limiting | express-rate-limit |
| Security headers | Helmet |

---

## Pushing to GitHub from Termux

```bash
cd globalbite
git init
git add .
git commit -m "feat: initial GlobalBite monorepo"
git remote add origin https://github.com/YOUR_USERNAME/globalbite.git
git branch -M main
git push -u origin main
```

---

## Deployment

**Backend (Railway / Render):**
- Set environment variables in the dashboard
- Build command: `npm install`
- Start command: `node server.js`

**Frontend (Vercel):**
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Add `VITE_SPOONACULAR_KEY` in Vercel environment variables

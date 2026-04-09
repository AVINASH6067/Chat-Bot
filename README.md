# 🤖 Fullstack AI Chatbot

A fullstack AI chatbot application built with React, Node.js, Express, MongoDB, and OpenRouter (LLM API).
It supports user authentication, persistent chat history, and temporary chat sessions.

---

## 🚀 Features

- User Authentication (JWT)
- Multi-chat support
- Chat history stored in MongoDB
- Temporary Chat (not stored in DB)
- Auto-load chats on refresh
- Typing animation (ChatGPT-like)
- Protected API routes
- User-specific chats (no data leakage)

---

## 🛠️ Tech Stack

Frontend:
- React (Vite)
- Axios
- React Markdown

Backend:
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- bcrypt (password hashing)

AI Integration:
- OpenRouter API

---

## 📁 Project Structure

chatbot/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── Login.jsx
│   │   └── index.css
│
├── backend/
│   ├── models/
│   ├── Routes/
│   ├── middleware/
│   └── server.js

---

## ⚙️ Setup Instructions

1. Clone the repo
git clone https://github.com/your-username/your-repo.git
cd your-repo

2. Backend Setup
cd backend
npm install

Create .env file:
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
OPENROUTER_API_KEY=your_api_key

Run backend:
node server.js

3. Frontend Setup
cd frontend
npm install
npm run dev

---

## 🔐 Authentication Flow

1. User registers
2. User logs in → receives JWT token
3. Token stored in localStorage
4. Token sent with every API request
5. Backend verifies user → returns user-specific data

---

## 💬 Chat Flow

- Each chat is linked to a user via userId
- Last 6 messages are sent to AI for context
- Temporary chats are NOT stored in database

---

## 📌 API Endpoints

Auth:
POST /api/auth/register
POST /api/auth/login

Chat:
POST /chat (protected)
GET /chats (protected)

---

## 🙌 Author

Avinash Mishra

---

## ⭐ If you like this project
Give it a star on GitHub!

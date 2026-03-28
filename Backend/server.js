import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import OpenAI from "openai";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();

/* ================== CORS (VERY IMPORTANT FIRST) ================== */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// allow preflight requests


/* ================== MIDDLEWARE ================== */
app.use(express.json());

/* ================== DB ================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

/* ================== MODELS ================== */
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
});

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    chatId: String,
    messages: [
      {
        role: String,
        content: String,
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Chat = mongoose.model("Chat", chatSchema);

/* ================== JWT MIDDLEWARE ================== */
const protect = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { userId }
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

/* ================== OPENROUTER ================== */
const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

/* ================== AUTH ================== */

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    await User.create({ email, password: hashed });

    res.json({ message: "User registered" });
  } catch {
    res.status(400).json({ error: "User already exists" });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ error: "Wrong password" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });

  } catch (err) {
    res.status(500).json({ error: "Login error" });
  }
});

/* ================== CHAT ================== */

// SEND MESSAGE
app.post("/chat", protect, async (req, res) => {
  try {
    const { message, chatId, isTemporary } = req.body;

    let chat = null;

    if (!isTemporary) {
      chat = await Chat.findOne({
        chatId,
        userId: req.user.userId,
      });

      if (!chat) {
        chat = new Chat({
          chatId,
          userId: req.user.userId,
          messages: [],
        });
      }

      chat.messages.push({ role: "user", content: message });
    }

    let messagesForAI = [];

    if (isTemporary) {
      messagesForAI = [
        { role: "system", content: "You are a helpful AI assistant." },
        { role: "user", content: message },
      ];
    } else {
      const lastMessages = chat.messages.slice(-6);

      messagesForAI = [
        { role: "system", content: "You are a helpful AI assistant." },
        ...lastMessages,
      ];
    }

    const response = await client.chat.completions.create({
      model: "meta-llama/llama-3-8b-instruct",
      messages: messagesForAI,
    });

    const reply = response.choices[0].message.content;

    if (!isTemporary) {
      chat.messages.push({ role: "assistant", content: reply });
      await chat.save();
    }

    res.json({ chatId, bot: reply });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Chat error" });
  }
});

// GET USER CHATS
app.get("/chats", protect, async (req, res) => {
  try {
    const chats = await Chat.find({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });

    res.json(chats);
  } catch {
    res.status(500).json({ error: "Error fetching chats" });
  }
});

/* ================== SERVER ================== */
app.listen(5000, () => {
  console.log("Server running on port 5000");
});

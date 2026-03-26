import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import OpenAI from "openai";
import connectDB from "./config/db.js";
import Chat from "./models/Chats.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ chat memory
const chats = {};

// OpenRouter setup
const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

app.get("/", (req, res) => {
  res.send("AI Chatbot Running (OpenRouter)");
});

app.post("/chat", async (req, res) => {
  try {
    const { message, chatId, isTemporary } = req.body;

    let chat = null;

    // ✅ ONLY FETCH DB CHAT IF NOT TEMP
    if (!isTemporary) {
      chat = await Chat.findOne({ chatId });

      if (!chat) {
        chat = new Chat({
          chatId,
          messages: [],
        });
      }

      // add user message to DB
      chat.messages.push({ role: "user", content: message });
    }

    // ✅ messages for AI (handle temp + normal)
    let messagesForAI = [];

    if (isTemporary) {
      // temp → only current message
      messagesForAI = [
        {
          role: "system",
          content: "You are a helpful AI assistant.",
        },
        {
          role: "user",
          content: message,
        },
      ];
    } else {
      // normal → last 6 messages
      const lastMessages = chat.messages.slice(-6);

      messagesForAI = [
        {
          role: "system",
          content: "You are a helpful AI assistant.",
        },
        ...lastMessages,
      ];
    }

    const response = await client.chat.completions.create({
      model: "meta-llama/llama-3-8b-instruct",
      messages: messagesForAI,
    });

    const reply = response.choices[0].message.content;

    // ✅ SAVE ONLY IF NOT TEMP
    if (!isTemporary) {
      chat.messages.push({ role: "assistant", content: reply });
      await chat.save();
    }

    res.json({
      chatId,
      bot: reply,
    });
    app.get("/chats", async (req, res) => {
  try {
    const chats = await Chat.find().sort({ createdAt: -1 });

    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: "Error fetching chats" });
  }
});

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
});



app.listen(5000, () => {
  console.log("Server running on port 5000");
});














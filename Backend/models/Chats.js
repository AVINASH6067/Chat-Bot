import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: String,
  content: String,
});

const chatSchema = new mongoose.Schema({
  chatId: String,
  messages: [messageSchema],
});

export default mongoose.model("Chat", chatSchema);
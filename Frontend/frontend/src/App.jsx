import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "./index.css";

function App() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  const stopRef = useRef(false);
  const typingRef = useRef(null);
  const endRef = useRef(null);

  const currentChat =
    chats.find((c) => c.id === currentChatId) || null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
   
  }, [chats]);
  

  // ✅ CREATE CHAT
  const createChat = (isTemp = false) => {
    const newChat = {
      id: Date.now().toString(),
      title: isTemp ? "Temporary Chat" : "New Chat",
      messages: [],
      isTemporary: isTemp,
    };

    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  // ✅ SEND MESSAGE
  const sendMessage = async () => {
    if (!message || !currentChat || isTyping) return;

    const userMsg = { role: "user", content: message };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === currentChatId
          ? { ...chat, messages: [...chat.messages, userMsg] }
          : chat
      )
    );

    setMessage("");
    setIsTyping(true);
    stopRef.current = false;

    try {
      const res = await axios.post("http://localhost:5000/chat", {
        message,
        chatId: currentChatId,
        isTemporary: currentChat.isTemporary, // 🔥 TEMP SUPPORT
      });

      const text = res.data.bot;
      let i = 0;

      // add empty bot message
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  { role: "assistant", content: "" },
                ],
              }
            : chat
        )
      );

      typingRef.current = setInterval(() => {
        if (stopRef.current) {
          clearInterval(typingRef.current);
          setIsTyping(false);
          return;
        }

        i++;

        setChats((prev) =>
          prev.map((chat) => {
            if (chat.id !== currentChatId) return chat;

            const msgs = [...chat.messages];
            msgs[msgs.length - 1] = {
              role: "assistant",
              content: text.slice(0, i),
            };

            return { ...chat, messages: msgs };
          })
        );

        if (i >= text.length) {
          clearInterval(typingRef.current);
          setIsTyping(false);
        }
      }, 20);

      // ✅ TITLE UPDATE FIX
      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id !== currentChatId) return chat;

          if (
            chat.title === "New Chat" ||
            chat.title === "Temporary Chat"
          ) {
            return {
              ...chat,
              title: message.slice(0, 25),
            };
          }

          return chat;
        })
      );

    } catch (err) {
      console.log(err);
      setIsTyping(false);
    }
  };

  return (
    <div className="app">

      {/* SIDEBAR */}
      <div className="sidebar">
        <button onClick={() => createChat(false)}>+ New Chat</button>
        <button onClick={() => createChat(true)}>⚡ Temporary Chat</button>

        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`chat-item ${
              currentChatId === chat.id ? "active" : ""
            }`}
            onClick={() => setCurrentChatId(chat.id)}
          >
            {chat.title}
            {chat.isTemporary && " (Temp)"}
          </div>
        ))}
      </div>

      {/* CHAT AREA */}
      <div className="chat-area">
        {!currentChat ? (
          <div className="empty">
            <h2>Start a new chat 🚀</h2>
          </div>
        ) : (
          <>
            <div className="header">{currentChat.title}</div>

            <div className="messages">
              {currentChat.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`bubble ${
                    msg.role === "user" ? "user" : "bot"
                  }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ))}

              {isTyping && <div className="typing">..</div>}
              <div ref={endRef} />
            </div>

            <div className="input-box">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && sendMessage()
                }
                placeholder="Type message..."
              />

              <button onClick={sendMessage}>Send</button>
              <button onClick={() => (stopRef.current = true)}>
                Stop
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
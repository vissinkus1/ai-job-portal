import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../services/api";
import "../App.css";
import "./Chat.css";

const socket = io("http://localhost:5000");

export default function Chat() {
  const [searchParams] = useSearchParams();
  const initUserId = searchParams.get("user");
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(initUserId || null);
  const [activeName, setActiveName] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [myId, setMyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchProfile();
    fetchConversations();
  }, []);

  useEffect(() => {
    if (myId) {
      socket.emit("join", myId);

      socket.on("newMessage", (msg) => {
        if (
          msg.sender === activeChat ||
          msg.receiver === activeChat
        ) {
          setMessages((prev) => [...prev, msg]);
        }
        fetchConversations();
      });

      return () => socket.off("newMessage");
    }
  }, [myId, activeChat]);

  useEffect(() => {
    if (activeChat) fetchMessages(activeChat);
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/profile/me");
      setMyId(res.data._id);
    } catch {
      // ignore
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await api.get("/chat/conversations");
      setConversations(res.data);

      // If initUserId is set but not in conversations, fetch that user
      if (initUserId) {
        setActiveChat(initUserId);
        const existing = res.data.find((c) => c.userId === initUserId);
        if (existing) setActiveName(existing.user?.name || "User");
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const res = await api.get(`/chat/${userId}`);
      setMessages(res.data);

      const convo = conversations.find((c) => c.userId === userId);
      if (convo) setActiveName(convo.user?.name || "User");
    } catch {
      // ignore
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeChat) return;

    try {
      const res = await api.post(`/chat/${activeChat}`, { content: input.trim() });
      setMessages((prev) => [...prev, res.data]);
      setInput("");
      socket.emit("sendMessage", {
        ...res.data,
        receiverId: activeChat,
      });
      fetchConversations();
    } catch {
      // ignore
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>💬 Messages</h2>
        </div>

        {conversations.length === 0 ? (
          <div className="chat-empty-sidebar">
            <p>No conversations yet</p>
          </div>
        ) : (
          <div className="chat-list">
            {conversations.map((conv) => (
              <button
                key={conv.userId}
                className={`chat-contact ${activeChat === conv.userId ? "active" : ""}`}
                onClick={() => {
                  setActiveChat(conv.userId);
                  setActiveName(conv.user?.name || "User");
                }}
              >
                <div className="contact-avatar">
                  {conv.user?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="contact-info">
                  <h4>{conv.user?.name || "User"}</h4>
                  <p>{conv.lastMessage?.substring(0, 40)}{conv.lastMessage?.length > 40 ? "..." : ""}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="unread-badge">{conv.unread}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="chat-main">
        {activeChat ? (
          <>
            <div className="chat-main-header">
              <div className="contact-avatar small">
                {activeName?.charAt(0).toUpperCase() || "?"}
              </div>
              <h3>{activeName}</h3>
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-start-msg">
                  <p>Start the conversation! 👋</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={msg._id || i}
                    className={`chat-bubble ${msg.sender === myId ? "sent" : "received"}`}
                  >
                    <p>{msg.content}</p>
                    <span className="chat-time">{formatTime(msg.createdAt)}</span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-bar" onSubmit={sendMessage}>
              <input
                type="text"
                className="glass-input"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" className="glass-button" disabled={!input.trim()}>
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="chat-no-selection">
            <div className="chat-no-icon">💬</div>
            <h3>Select a conversation</h3>
            <p>Choose someone from the sidebar to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

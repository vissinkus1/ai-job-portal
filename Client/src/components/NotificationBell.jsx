import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../services/api";
import { SERVER_URL } from "../config/apiConfig";
import "./NotificationBell.css";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);
  const socketRef = useRef(null);
  const myIdRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Setup socket for real-time notifications
    socketRef.current = io(SERVER_URL);

    // Get user ID and join room
    api.get("/profile/me")
      .then((res) => {
        myIdRef.current = res.data._id;
        socketRef.current.emit("join", res.data._id);
      })
      .catch(() => {});

    // Listen for real-time notifications
    socketRef.current.on("newNotification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    // Fallback polling every 30s (reduced from 15s since we have real-time now)
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      clearInterval(interval);
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const timeAgo = (date) => {
    const s = Math.floor((new Date() - new Date(date)) / 1000);
    if (s < 60) return "Just now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  return (
    <div className="bell-wrapper" ref={bellRef}>
      <button className="bell-btn" onClick={() => setOpen(!open)}>
        🔔
        {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="bell-dropdown">
          <div className="bell-dropdown-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="mark-read-btn">
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="bell-empty">No notifications yet</p>
          ) : (
            <div className="bell-list">
              {notifications.slice(0, 10).map((n) => (
                <Link
                  to={n.link || "#"}
                  key={n._id}
                  className={`bell-item ${!n.read ? "unread" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  <div className="bell-item-content">
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                  </div>
                  <span className="bell-time">{timeAgo(n.createdAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

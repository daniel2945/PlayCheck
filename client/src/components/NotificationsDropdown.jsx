import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import useNotificationStore from "../store/useNotificationStore";
import useAuthStore from "../store/useAuthStore";

// פונקציית עזר לזמנים
const timeAgo = (dateInput) => {
  const date = new Date(dateInput);
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function NotificationsDropdown() {
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // שליפה בטוחה של ה-ID (פותר את הבעיה שההתראות לא נטענות)
  const currentUserId = user?._id || user?.id;

  useEffect(() => {
    if (currentUserId) {
      fetchNotifications(currentUserId);
      const interval = setInterval(
        () => fetchNotifications(currentUserId),
        60000,
      );
      return () => clearInterval(interval);
    }
  }, [currentUserId, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const getLink = (n) => {
    if (n.type.includes("thread")) return `/social/thread/${n.entityId}`;
    if (n.type.includes("post")) return `/social`;
    if (n.type === "review_report") return `/admin#reported-reviews`;
    if (n.type === "post_report") return `/admin#reported-posts`;
    if (n.type === "thread_report") return `/admin#reported-threads`;
    return "/";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#9aa0a6] hover:text-[#8ab4f8] transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#EA4335] text-[10px] text-white font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-[#28292c] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#202124]">
            <h3 className="font-bold text-[#e8eaed]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead(currentUserId)}
                className="text-xs text-[#8ab4f8] hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-[#9aa0a6] text-sm">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = notif.isAdminNotification
                  ? !notif.readBy?.includes(currentUserId)
                  : !notif.isRead;
                return (
                  <Link
                    key={notif._id}
                    to={getLink(notif)}
                    onClick={() => {
                      markAsRead(notif._id, currentUserId);
                      setIsOpen(false);
                    }}
                    className={`block p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${isUnread ? "bg-white/5" : ""}`}
                  >
                    <div className="flex gap-3 items-start">
                      {notif.sender?.avatar ? (
                        <img
                          src={notif.sender.avatar}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#8ab4f8] text-[#202124] flex items-center justify-center font-bold shrink-0">
                          {notif.sender?.userName?.charAt(0).toUpperCase() ||
                            "S"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#e8eaed] leading-snug">
                          <span className="font-bold">
                            {notif.sender?.userName || "System"}
                          </span>{" "}
                          {notif.message}
                        </p>
                        <p className="text-xs text-[#5f6368] mt-1 font-medium">
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>
                      {isUnread && (
                        <div className="w-2 h-2 rounded-full bg-[#8ab4f8] mt-2 shrink-0"></div>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

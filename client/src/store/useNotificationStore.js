import { create } from "zustand";
import API_CALL from "../api/API_CALL";

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async (userId) => {
    try {
      const res = await API_CALL("/api/notifications", "GET");
      if (res.success) {
        const notifications = res.data;
        const unreadCount = notifications.filter((n) =>
          n.isAdminNotification ? !n.readBy?.includes(userId) : !n.isRead,
        ).length;
        set({ notifications, unreadCount });
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  },

  markAsRead: async (id, userId) => {
    try {
      await API_CALL(`/api/notifications/${id}/read`, "PUT");
      get().fetchNotifications(userId);
    } catch (err) {}
  },

  markAllAsRead: async (userId) => {
    try {
      await API_CALL("/api/notifications/read-all", "PUT");
      get().fetchNotifications(userId);
    } catch (err) {}
  },
}));
export default useNotificationStore;

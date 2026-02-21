import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  stompClient: null,
  subscription: null,
  messages: {}, // { userId: [messages] }
  users: [],
  onlineUsers: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  // 🔹 setters
  setStompClient: (client) => set({ stompClient: client }),
  setOnlineUsers: (list) => set({ onlineUsers: Array.isArray(list) ? list : [] }),
  setSelectedUser: (user) => set({ selectedUser: user }),

  // 🔹 fetch all chat users
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/api/messages/users");
      set({ users: Array.isArray(res.data) ? res.data : [] });
    } catch (error) {
      console.error("❌ Failed to fetch users:", error);
      set({ users: [] });
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // 🔹 fetch messages for a user
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/api/messages/${userId}`);
      set((state) => ({
        messages: {
          ...state.messages,
          [userId]: Array.isArray(res.data) ? res.data : [],
        },
      }));
    } catch (error) {
      console.error("❌ Failed to fetch messages:", error);
      set((state) => ({
        messages: { ...state.messages, [userId]: [] },
      }));
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // 🔹 send message via STOMP
  sendMessage: (messageData) => {
    const { selectedUser, stompClient } = get();
    if (!selectedUser?.id || !stompClient || !stompClient.connected) return;

    const payload = {
      receiverId: selectedUser.id,
      text: messageData.text || "",
      image: messageData.image || null,
    };

    stompClient.publish({
      destination: "/app/chat.sendMessage",
      body: JSON.stringify(payload),
    });
  },

  // 🔹 subscribe to incoming messages
 subscribeToMessages: () => {
  const { stompClient, subscription } = get();

  if (!stompClient || !stompClient.connected) return;

  // 🚨 ALWAYS unsubscribe before re-subscribing
  if (subscription) {
    subscription.unsubscribe();
  }

  const authUser = useAuthStore.getState().authUser;

  const newSub = stompClient.subscribe("/user/queue/messages", (msg) => {
    const newMessage = JSON.parse(msg.body);

    set((state) => {
      const otherUserId =
        newMessage.senderId === authUser.id
          ? newMessage.receiverId
          : newMessage.senderId;

      return {
        messages: {
          ...state.messages,
          [otherUserId]: [
            ...(state.messages[otherUserId] || []),
            newMessage,
          ],
        },
      };
    });
  });

  set({ subscription: newSub });
},
  // 🔹 unsubscribe safely
  unsubscribeFromMessages: () => {
    const { subscription } = get();
    if (subscription) {
      subscription.unsubscribe();
    }
    set({ subscription: null });
  },
}));


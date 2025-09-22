import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { connectSocket } from "./connectSocket";
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

  // setters
  setStompClient: (client) => set({ stompClient: client }),
  setOnlineUsers: (list) => set({ onlineUsers: Array.isArray(list) ? list : [] }),
  setSelectedUser: (user) => set({ selectedUser: user }),

  // ✅ fetch all chat users
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const token = localStorage.getItem("token");
      const res = await axiosInstance.get("/api/messages/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ users: Array.isArray(res.data) ? res.data : [] });
    } catch (error) {
      console.error("❌ Failed to fetch users:", error);
      set({ users: [] });
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // ✅ fetch messages for a user
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const token = localStorage.getItem("token");
      const res = await axiosInstance.get(`/api/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      set((state) => ({
        messages: { ...state.messages, [userId]: Array.isArray(res.data) ? res.data : [] },
      }));
    } catch (error) {
      console.error("❌ Failed to fetch messages:", error);
      set((state) => ({ messages: { ...state.messages, [userId]: [] } }));
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // ✅ send message via websocket
  sendMessage: (messageData) => {
    const { selectedUser, stompClient } = get();
    if (!selectedUser?.id || !stompClient || !stompClient.connected) return;

    const payload = {
      receiverId: selectedUser.id,
      text: messageData.text || "",
      image: messageData.image || null,
    };

    stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(payload));

    // ❌ no optimistic fakeMessage → wait for backend echo
  },

  // ✅ subscribe to incoming messages
  subscribeToMessages: () => {
    const { subscription, stompClient } = get();
    if (!stompClient || !stompClient.connected) return;

    // already subscribed → don’t duplicate
    if (subscription) return;

    const authUser = useAuthStore.getState().authUser;

    const newSub = stompClient.subscribe("/user/queue/messages", (msg) => {
      try {
        const newMessage = JSON.parse(msg.body);
        const { messages } = get();

        // figure out conversation partner
        const otherUserId =
          newMessage.sender?.id === authUser?.id
            ? newMessage.receiver?.id
            : newMessage.sender?.id;

        if (!otherUserId) return;

        set({
          messages: {
            ...messages,
            [otherUserId]: [...(messages[otherUserId] || []), newMessage],
          },
        });
      } catch (e) {
        console.error("❌ Parse incoming message failed:", e);
      }
    });

    set({ subscription: newSub });
  },

  unsubscribeFromMessages: () => {
    const { subscription } = get();
    if (subscription) {
      subscription.unsubscribe();
    }
    set({ subscription: null });
  },
}));


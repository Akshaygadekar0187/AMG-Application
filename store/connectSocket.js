import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { useChatStore } from "./useChatStore";

let stompClient = null;

export function connectSocket() {
  // Prevent duplicate clients
  if (stompClient?.active) return;

  const token = localStorage.getItem("token");
  if (!token) {
    console.error("❌ No JWT token found in localStorage");
    return;
  }

  stompClient = new Client({
    webSocketFactory: () =>
      new SockJS(
        `http://localhost:8080/ws?token=${encodeURIComponent(token)}`
      ),

    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },

    reconnectDelay: 5000,
    debug: () => {},
  });

  stompClient.onConnect = () => {
    console.log("✅ WebSocket connected");

    const store = useChatStore.getState();

    // 🔥 always reset state on reconnect
    store.setStompClient(stompClient);
    store.unsubscribeFromMessages();

    // 🔹 online users
    stompClient.subscribe("/topic/online-users", (msg) => {
      store.setOnlineUsers(JSON.parse(msg.body));
    });

    // 🔹 personal messages (ALWAYS resubscribe)
    store.subscribeToMessages();
  };

  stompClient.onStompError = (frame) => {
    console.error("❌ STOMP error:", frame.headers["message"]);
  };

  stompClient.onWebSocketError = (err) => {
    console.error("❌ WebSocket connection error:", err);
  };

  stompClient.activate();
}

export function disconnectSocket() {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;

    const store = useChatStore.getState();
    store.unsubscribeFromMessages();
    store.setStompClient(null);

    console.log("🔌 WebSocket disconnected");
  }
}

export function isSocketConnected() {
  return !!stompClient?.connected;
}


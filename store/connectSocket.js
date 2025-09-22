import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { useChatStore } from "./useChatStore";

let stompClient = null;

export function connectSocket() {
  if (stompClient && stompClient.active) return;

  const token = localStorage.getItem("token");
  if (!token) {
    console.error("❌ No JWT token found in localStorage");
    return;
  }

  const socketFactory = () =>
    new SockJS(`http://localhost:8080/ws?token=${encodeURIComponent(token)}`);

  stompClient = Stomp.over(socketFactory);
  stompClient.debug = () => {}; // silence debug logs

  stompClient.connect({ Authorization: `Bearer ${token}` }, () => {
    console.log("✅ WebSocket connected");

    const store = useChatStore.getState();
    store.setStompClient(stompClient);

    // Broadcast updates for all online users
    stompClient.subscribe("/topic/online-users", (msg) => {
      const payload = JSON.parse(msg.body);
      store.setOnlineUsers(payload);
    });

    // Subscribe to chat messages
    store.subscribeToMessages();
  }, (err) => {
    console.error("❌ WebSocket connection error:", err);
    setTimeout(connectSocket, 5000); // reconnect
  });
}

export function disconnectSocket() {
  if (stompClient) {
    if (stompClient.active) stompClient.deactivate();
    stompClient = null;
    useChatStore.getState().setStompClient(null);
    console.log("🔌 WebSocket disconnected");
  }
}

export function isSocketConnected() {
  return !!stompClient?.active;
}


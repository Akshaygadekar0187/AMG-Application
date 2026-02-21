import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { connectSocket, disconnectSocket } from "./connectSocket";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isUpdatingProfile: false,
  isSigningUp: false,
  isLoggingIn: false,

  // 🔹 Check authentication on app load
  checkAuth: async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      set({ authUser: null, isCheckingAuth: false });
      disconnectSocket();
      return;
    }

    try {
      const res = await axiosInstance.get("/api/auth/me");
      set({ authUser: res.data });
      connectSocket(); // 🔌 connect WebSocket when valid token exists
    } catch (err) {
      console.error("❌ Auth check failed:", err);
      localStorage.removeItem("token");
      set({ authUser: null });
      disconnectSocket();
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // 🔹 Signup
  signup: async (formData) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/api/auth/signup", formData);
      toast.success("Signup successful! Please login.");
      return res.data;
    } catch (err) {
      console.error("❌ Signup error:", err);
      toast.error(err?.response?.data?.message || "Signup failed");
      throw err;
    } finally {
      set({ isSigningUp: false });
    }
  },

  // 🔹 Login
  login: async (credentials) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/api/auth/login", credentials);
      const { token, userId, user } = res.data;

      if (!token) throw new Error("Invalid login response: missing token");

      localStorage.setItem("token", token);
      set({ authUser: user || { id: userId } });

      toast.success("Login successful");
      connectSocket();
    } catch (err) {
      console.error("❌ Login error:", err);
      toast.error(err?.response?.data?.message || "Login failed");
      set({ authUser: null });
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // 🔹 Logout
  logout: () => {
    localStorage.removeItem("token");
    disconnectSocket();
    set({ authUser: null });
    toast.success("Logged out");
  },

  // 🔹 Update profile
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const formData = new FormData();

      if (data.fullName) formData.append("fullName", data.fullName);
      if (data.email) formData.append("email", data.email);
      if (data.profilePic) formData.append("profilePic", data.profilePic);

      const res = await axiosInstance.put("/api/auth/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("❌ Profile update error:", error);
      toast.error(error?.response?.data?.message || "Update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // 🔹 Handle token expiration (called by axios interceptors)
  handleTokenExpired: () => {
    toast.error("Session expired. Please login again.");
    localStorage.removeItem("token");
    disconnectSocket();
    set({ authUser: null });
  },
}));




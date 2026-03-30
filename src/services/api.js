import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (data) => api.post("/auth/register", data);
export const login = (data) => api.post("/auth/login", data);
export const getMe = () => api.get("/auth/me");
export const switchWorkspace = (workspaceId) => api.put("/auth/switch-workspace", { workspaceId });
export const forgotPassword = (email) => api.post("/auth/forgot-password", { email });
export const verifyResetCode = (code) => api.post("/auth/verify-reset-code", { code });
export const resetPassword = (code, password) => api.post("/auth/reset-password", { code, password });

// Projects
export const getProjects = (status) =>
  api.get(`/projects${status ? `?status=${status}` : ""}`);
export const getProject = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post("/projects", data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);

// Team
export const getTeamMembers = () => api.get("/team");
export const createTeamMember = (data) => api.post("/team", data);
export const updateTeamMember = (id, data) => api.put(`/team/${id}`, data);
export const deleteTeamMember = (id) => api.delete(`/team/${id}`);

// Upload
export const uploadAvatar = (formData) =>
  api.post("/upload/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Profile
export const updateProfile = (data) => api.put("/auth/update-profile", data);

// Tasks
export const getMyTasks = () => api.get("/tasks/my");
export const getAllTasks = () => api.get("/tasks");
export const getTasks = (projectId) => api.get(`/tasks?project=${projectId}`);
export const createTask = (data) => api.post("/tasks", data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const reorderTasks = (tasks) => api.put("/tasks/reorder", { tasks });
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

// Events
export const getEvents = () => api.get("/events");
export const createEvent = (data) => api.post("/events", data);
export const deleteEvent = (id) => api.delete(`/events/${id}`);

// Meet / Messaging
export const getConversations = () => api.get("/meet/conversations");
export const createConversation = (userId) => api.post("/meet/conversations", { userId });
export const getMessages = (conversationId) => api.get(`/meet/conversations/${conversationId}/messages`);
export const sendMessage = (conversationId, text) => api.post(`/meet/conversations/${conversationId}/messages`, { text });
export const sendAudioMessage = (conversationId, formData) =>
  api.post(`/meet/conversations/${conversationId}/audio`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const markConversationRead = (conversationId) => api.put(`/meet/conversations/${conversationId}/read`);
export const getUnreadCount = () => api.get("/meet/unread");

// Voice Rooms
export const getVoiceRooms = () => api.get("/meet/rooms");
export const createVoiceRoom = (name) => api.post("/meet/rooms", { name });
export const joinVoiceRoom = (id) => api.put(`/meet/rooms/${id}/join`);
export const leaveVoiceRoom = (id) => api.put(`/meet/rooms/${id}/leave`);
export const deleteVoiceRoom = (id) => api.delete(`/meet/rooms/${id}`);

export default api;

import axios from "axios";

const api = axios.create({
  baseURL: "https://backend-gestao-acesso-sha.onrender.com",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    console.log("🔑 Token enviado pelo axios:", token);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

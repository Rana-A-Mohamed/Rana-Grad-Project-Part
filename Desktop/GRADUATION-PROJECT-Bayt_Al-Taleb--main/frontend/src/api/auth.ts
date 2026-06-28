// api/auth.ts
import api from "./axios";
export const loginApi = async (email: string, password: string) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data; 
};

export const registerApi = async (email: string, password: string, fullName: string) => {
  const res = await api.post("/auth/register", { email, password, fullName });
  return res.data;
};

export const logoutApi = async (refreshToken: string) => {
  const res = await api.post("/auth/logout", { refreshToken });
  return res.data;
};
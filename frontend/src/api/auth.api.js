import { client } from "./client";

export const authApi = {
  login: (credentials) => client.post("/api/auth/login", credentials),
  logout: () => client.post("/api/auth/logout"),
  getCurrentUser: () => client.get("/api/auth/me"),
};

import { client } from "./client";

export const membersApi = {
  getAll: () => client.get("/api/members"),
  getById: (id) => client.get(`/api/members/${id}`),
  create: (data) => client.post("/api/members", data),
  update: (id, data) => client.put(`/api/members/${id}`, data),
  delete: (id) => client.delete(`/api/members/${id}`),
};

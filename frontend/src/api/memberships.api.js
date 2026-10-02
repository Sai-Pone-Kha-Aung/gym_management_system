import { client } from "./client";

export const membershipsApi = {
  getAll: () => client.get("/api/memberships"),
  getById: (id) => client.get(`/api/memberships/${id}`),
  create: (data) => client.post("/api/memberships", data),
  update: (id, data) => client.put(`/api/memberships/${id}`, data),
  delete: (id) => client.delete(`/api/memberships/${id}`),
};

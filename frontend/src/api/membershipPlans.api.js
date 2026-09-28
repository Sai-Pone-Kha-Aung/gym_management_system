import { client } from "./client";

export const membershipPlansApi = {
  getAll: () => client.get("/api/membership-plans"),
  getById: (id) => client.get(`/api/membership-plans/${id}`),
  create: (data) => client.post("/api/membership-plans", data),
  update: (id, data) => client.put(`/api/membership-plans/${id}`, data),
  delete: (id) => client.delete(`/api/membership-plans/${id}`),
};

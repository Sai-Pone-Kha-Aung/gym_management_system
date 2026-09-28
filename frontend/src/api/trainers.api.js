import { client } from "./client";

export const trainersApi = {
  getAll: () => client.get("/api/trainers"),
  getById: (id) => client.get(`/api/trainers/${id}`),
  create: (data) => client.post("/api/trainers", data),
  update: (id, data) => client.put(`/api/trainers/${id}`, data),
  delete: (id) => client.delete(`/api/trainers/${id}`),
};

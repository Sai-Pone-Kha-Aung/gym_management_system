import { client } from "./client";

export const trainingSessionsApi = {
  getAll: () => client.get("/api/training-sessions"),
  getById: (id) => client.get(`/api/training-sessions/${id}`),
  create: (data) => client.post("/api/training-sessions", data),
  update: (id, data) => client.put(`/api/training-sessions/${id}`, data),
  delete: (id) => client.delete(`/api/training-sessions/${id}`),
};

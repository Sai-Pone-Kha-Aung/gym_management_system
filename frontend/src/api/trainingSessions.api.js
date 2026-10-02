import { client } from "./client";

export const trainingSessionsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, v);
    });
    const qs = query.toString();
    return client.get(`/api/training-sessions${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => client.get(`/api/training-sessions/${id}`),
  create: (data) => client.post("/api/training-sessions", data),
  update: (id, data) => client.put(`/api/training-sessions/${id}`, data),
  delete: (id, mode) => client.delete(`/api/training-sessions/${id}${mode ? `?mode=${mode}` : ""}`),
};

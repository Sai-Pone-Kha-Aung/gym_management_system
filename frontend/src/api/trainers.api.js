import { client } from "./client";

export const trainersApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, v);
    });
    const qs = query.toString();
    return client.get(`/api/trainers${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => client.get(`/api/trainers/${id}`),
  create: (data) => client.post("/api/trainers", data),
  update: (id, data) => client.put(`/api/trainers/${id}`, data),
  delete: (id, mode) => client.delete(`/api/trainers/${id}${mode ? `?mode=${mode}` : ""}`),
};

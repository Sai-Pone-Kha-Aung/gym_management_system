import { client } from "./client";

export const membershipPlansApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, v);
    });
    const qs = query.toString();
    return client.get(`/api/membership-plans${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => client.get(`/api/membership-plans/${id}`),
  create: (data) => client.post("/api/membership-plans", data),
  update: (id, data) => client.put(`/api/membership-plans/${id}`, data),
  delete: (id) => client.delete(`/api/membership-plans/${id}`),
};

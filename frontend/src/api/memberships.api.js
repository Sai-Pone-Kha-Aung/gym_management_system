import { client } from "./client";

export const membershipsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, v);
    });
    const queryString = query.toString();
    return client.get(`/api/memberships${queryString ? `?${queryString}` : ""}`);
  },
  getById: (id) => client.get(`/api/memberships/${id}`),
  create: (data) => client.post("/api/memberships", data),
  update: (id, data) => client.put(`/api/memberships/${id}`, data),
  delete: (id, mode) => client.delete(`/api/memberships/${id}${mode ? `?mode=${mode}` : ""}`),
};

export default membershipsApi;

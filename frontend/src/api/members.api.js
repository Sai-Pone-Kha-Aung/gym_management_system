import { client } from "./client";

export const membersApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, v);
    });
    const qs = query.toString();
    return client.get(`/api/members${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => client.get(`/api/members/${id}`),
  create: (data) => client.post("/api/members", data),
  update: (id, data) => client.put(`/api/members/${id}`, data),
  delete: (id, mode) => client.delete(`/api/members/${id}${mode ? `?mode=${mode}` : ""}`),
};

import { client } from "./client";

export const membershipsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append("status", params.status);
    if (params.memberId) query.append("memberId", params.memberId);
    if (params.planId) query.append("planId", params.planId);
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    const queryString = query.toString();
    return client.get(`/api/memberships${queryString ? `?${queryString}` : ""}`);
  },
  getById: (id) => client.get(`/api/memberships/${id}`),
  create: (data) => client.post("/api/memberships", data),
  update: (id, data) => client.put(`/api/memberships/${id}`, data),
  delete: (id) => client.delete(`/api/memberships/${id}`),
};

export default membershipsApi;

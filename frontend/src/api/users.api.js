import { client } from "./client";

export const usersApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, v);
    });
    const queryString = query.toString();
    return client.get(`/api/users${queryString ? `?${queryString}` : ""}`);
  },
  getById: (id) => client.get(`/api/users/${id}`),
  create: (data) => client.post("/api/users", data),
  update: (id, data) => client.put(`/api/users/${id}`, data),
  delete: (id, mode = "soft") => client.delete(`/api/users/${id}?mode=${mode}`),
};

export const userApi = usersApi;
export default usersApi;

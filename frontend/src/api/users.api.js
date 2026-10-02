import { client } from "./client";

export const usersApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();

    switch (params.action) {
      case "search":
        query.append("search", params.search);
        break;
      case "role":
        query.append("role", params.role);
        break;
      case "status":
        query.append("status", params.status);
        break;
      case "page":
        query.append("page", params.page);
        break;
      case "limit":
        query.append("limit", params.limit);
        break;
      default:
        break;
    }
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

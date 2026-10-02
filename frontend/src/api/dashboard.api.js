import { client } from "./client";

export const dashboardApi = {
  getStats: () => client.get("/api/dashboard"),
};

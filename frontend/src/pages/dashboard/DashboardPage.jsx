import React, { useEffect, useState } from "react";
import StatSummary from "./components/StatSummary";
import TodayAgenda from "./components/TodayAgenda";
import { dashboardApi } from "../../api/dashboard.api";
import Spinner from "../../components/ui/Spinner";

export const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalTrainers: 0,
    activePlans: 0,
  });
  const [todaySessions, setTodaySessions] = useState([]);

  useEffect(() => {
    dashboardApi
      .getStats()
      .then((data) => {
        if (data) {
          setStats({
            totalMembers: data.kpis?.totalMembers ?? 0,
            totalTrainers: data.kpis?.totalTrainers ?? 0,
            activePlans: data.kpis?.activeMemberships ?? 0,
          });
          setTodaySessions(data.todaySessions || []);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch dashboard stats, using defaults:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Dashboard Overview
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Real-time operations, memberships and scheduling summary.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <StatSummary stats={stats} />
          <TodayAgenda sessions={todaySessions} />
        </>
      )}
    </div>
  );
};

export default DashboardPage;

import React from "react";
import StatCard from "../../../components/ui/StatCard";

export const StatSummary = ({ stats = {} }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title="Total Members"
        value={stats.totalMembers ?? "--"}
        icon="👥"
        subtitle="Registered athletes"
      />
      <StatCard
        title="Active Trainers"
        value={stats.totalTrainers ?? "--"}
        icon="🏋️"
        subtitle="Certified staff"
      />
      <StatCard
        title="Active Memberships"
        value={stats.activePlans ?? stats.activeMemberships ?? "--"}
        icon="💳"
        subtitle="Current active plans"
      />
    </div>
  );
};

export default StatSummary;

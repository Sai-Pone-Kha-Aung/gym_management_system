import React from "react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import { formatTime } from "../../../utils/dateUtils";

export const TodayAgenda = ({ sessions = [] }) => {
  return (
    <Card title="Today's Training Agenda">
      {sessions.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">
          No training sessions scheduled for today.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {sessions.map((session) => (
            <div
              key={session._id}
              className="py-3.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800 font-semibold text-xs">
                  {formatTime(session.startTime)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {session.member.name || "Member"}
                  </h4>
                  <p className="text-xs text-gray-500">
                    Trainer: {session.trainer?.name || "Trainer"} •{" "}
                    {session.duration || 60} mins
                  </p>
                </div>
              </div>
              <Badge status={session.status || "SCHEDULED"} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default TodayAgenda;

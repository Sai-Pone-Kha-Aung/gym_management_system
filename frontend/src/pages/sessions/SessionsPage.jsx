import React, { useState, useEffect } from "react";
import { trainingSessionsApi } from "../../api/trainingSessions.api";
import { membersApi } from "../../api/members.api";
import { trainersApi } from "../../api/trainers.api";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import ConfirmDialog from "../../components/feedback/ConfirmDialog";
import BookSessionModal from "./components/BookSessionModal";
import { formatDate, formatTime } from "../../utils/dateUtils";

export const SessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isBookOpen, setIsBookOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, membersRes, trainersRes] = await Promise.all([
        trainingSessionsApi.getAll().catch(() => []),
        membersApi.getAll().catch(() => []),
        trainersApi.getAll().catch(() => []),
      ]);

      setSessions(
        Array.isArray(sessionsRes.training_sessions)
          ? sessionsRes.training_sessions
          : [],
      );
      setMembers(Array.isArray(membersRes.members) ? membersRes.members : []);
      setTrainers(
        Array.isArray(trainersRes.trainers) ? trainersRes.trainers : [],
      );

      const trainingSessions = new Array();

      sessionsRes.training_sessions.forEach((session) => {
        trainingSessions.push({
          ...session,
          member: membersRes.members.find(
            (member) => member._id === session.memberId,
          ),
          trainer: trainersRes.trainers.find(
            (trainer) => trainer._id === session.trainerId,
          ),
        });
      });

      setSessions(trainingSessions);
    } catch (err) {
      console.error("Failed to load training sessions data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBook = async (formData) => {
    setActionLoading(true);
    try {
      await trainingSessionsApi.create(formData);
      setIsBookOpen(false);
      loadData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (sessionId, newStatus) => {
    try {
      await trainingSessionsApi.update(sessionId, { status: newStatus });
      loadData();
    } catch (err) {
      alert(err.message || "Failed to update session status");
    }
  };

  const handleCancelSession = async () => {
    if (!cancelTarget) return;
    setActionLoading(true);
    try {
      await trainingSessionsApi.delete(cancelTarget._id);
      setCancelTarget(null);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to cancel session");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: "Date & Time",
      accessor: "date",
      render: (row) => (
        <div>
          <span className="font-semibold text-gray-900 block">
            {formatDate(row.date)}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(row.startTime)} ({row.duration || 60}m)
          </span>
        </div>
      ),
    },
    {
      header: "Member",
      accessor: "memberId",
      render: (row) => (
        <div>
          <span className="font-medium text-gray-900 block">
            {row.member?.name || "Member"}
          </span>
          <span className="text-xs text-gray-500">
            {row.member?.phone || ""}
          </span>
        </div>
      ),
    },
    {
      header: "Trainer",
      accessor: "trainerId",
      render: (row) => {
        const spec = Array.isArray(row.trainer?.specialization)
          ? row.trainer?.specialization.join(", ")
          : row.trainer?.specialization;

        return (
          <div>
            <span className="font-medium text-gray-800 block">
              {row.trainer?.name || "Trainer"}
            </span>
            <span className="text-xs text-gray-500">{spec || ""}</span>
          </div>
        );
      },
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => <Badge status={row.status || "SCHEDULED"} />,
    },
    {
      header: "Actions",
      accessor: "_id",
      render: (row) => (
        <div className="flex items-center gap-2">
          {(row.status === "SCHEDULED" || row.status === "Scheduled") && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleStatusChange(row._id, "COMPLETED")}
            >
              Complete
            </Button>
          )}
          {row.status !== "CANCELLED" && row.status !== "Cancelled" && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setCancelTarget(row)}
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Training Sessions
          </h2>
          <p className="text-sm text-gray-500">
            Schedule 1-on-1 coach appointments, track schedules and attendance.
          </p>
        </div>
        <Button onClick={() => setIsBookOpen(true)}>+ Book Session</Button>
      </div>

      <Table
        columns={columns}
        data={sessions}
        emptyMessage={
          loading
            ? "Loading sessions..."
            : "No sessions scheduled. Book a session for an active member!"
        }
      />

      <BookSessionModal
        isOpen={isBookOpen}
        onClose={() => setIsBookOpen(false)}
        onSubmit={handleBook}
        members={members}
        trainers={trainers}
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelSession}
        title="Cancel Training Session"
        message="Are you sure you want to cancel this training appointment?"
        confirmText="Cancel Session"
        loading={actionLoading}
      />
    </div>
  );
};

export default SessionsPage;

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
        Array.isArray(sessionsRes) ? sessionsRes : sessionsRes?.sessions || []
      );
      setMembers(
        Array.isArray(membersRes) ? membersRes : membersRes?.members || []
      );
      setTrainers(
        Array.isArray(trainersRes) ? trainersRes : trainersRes?.trainers || []
      );
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
    } catch (err) {
      alert(err.message || "Failed to schedule session (e.g., trainer conflict or expired membership)");
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
            {row.memberId?.name || row.memberName || "Member"}
          </span>
          <span className="text-xs text-gray-500">
            {row.memberId?.phone || ""}
          </span>
        </div>
      ),
    },
    {
      header: "Trainer",
      accessor: "trainerId",
      render: (row) => (
        <div>
          <span className="font-medium text-gray-800 block">
            {row.trainerId?.name || row.trainerName || "Trainer"}
          </span>
          <span className="text-xs text-gray-500">
            {row.trainerId?.specialization || ""}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => <Badge status={row.status || "Scheduled"} />,
    },
    {
      header: "Actions",
      accessor: "_id",
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === "Scheduled" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleStatusChange(row._id, "Completed")}
            >
              Complete
            </Button>
          )}
          <Button
            size="sm"
            variant="danger"
            onClick={() => setCancelTarget(row)}
          >
            Cancel
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Training Sessions</h2>
          <p className="text-sm text-gray-500">
            Schedule 1-on-1 coach appointments, track schedules and attendance.
          </p>
        </div>
        <Button onClick={() => setIsBookOpen(true)}>
          + Book Session
        </Button>
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

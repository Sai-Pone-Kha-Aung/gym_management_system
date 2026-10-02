import React, { useState, useEffect, useCallback } from "react";
import { trainingSessionsApi } from "../../api/trainingSessions.api";
import { membersApi } from "../../api/members.api";
import { trainersApi } from "../../api/trainers.api";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import ConfirmDialog from "../../components/feedback/ConfirmDialog";
import BookSessionModal from "./components/BookSessionModal";
import { formatDate, formatTime } from "../../utils/dateUtils";

export const SessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [trainerFilter, setTrainerFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1,
    size: 10,
  });

  const [isBookOpen, setIsBookOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter, trainerFilter, dateFilter]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        size: pageSize,
      };
      if (statusFilter) params.status = statusFilter;
      if (trainerFilter) params.trainerId = trainerFilter;
      if (dateFilter) params.date = dateFilter;

      const [sessionsRes, membersRes, trainersRes] = await Promise.all([
        trainingSessionsApi.getAll(params).catch(() => ({})),
        membersApi.getAll({ size: 100 }).catch(() => []),
        trainersApi.getAll({ size: 100 }).catch(() => []),
      ]);

      const sList = Array.isArray(sessionsRes)
        ? sessionsRes
        : sessionsRes?.training_sessions || [];
      const mList = Array.isArray(membersRes)
        ? membersRes
        : membersRes?.members || [];
      const tList = Array.isArray(trainersRes)
        ? trainersRes
        : trainersRes?.trainers || [];

      setSessions(sList);
      setMembers(mList);
      setTrainers(tList);

      if (sessionsRes?.pagination) {
        setPagination({
          total: sessionsRes.pagination.total ?? sList.length,
          totalPages: sessionsRes.pagination.totalPage ?? 1,
          currentPage: sessionsRes.pagination.currentPage ?? page,
          size: sessionsRes.pagination.size ?? pageSize,
        });
      } else {
        setPagination({
          total: sList.length,
          totalPages: 1,
          currentPage: 1,
          size: pageSize,
        });
      }
    } catch (err) {
      console.error("Failed to load training sessions data:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, trainerFilter, dateFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBook = async (formData) => {
    setActionLoading(true);
    try {
      await trainingSessionsApi.create(formData);
      setIsBookOpen(false);
      loadData();
    } catch (err) {
      alert(
        err.message ||
          "Failed to schedule session (e.g., trainer conflict or expired membership)",
      );
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
      render: (row) => {
        const memId = row.memberId?._id || row.memberId;
        const member =
          row.member ||
          members.find((m) => m._id === memId) ||
          {};
        const name = member.name || row.memberName || "Member";
        const phone = member.phone || "";

        return (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
              {name ? name.slice(0, 2) : "MB"}
            </div>
            <div>
              <span className="font-medium text-gray-900 block">{name}</span>
              {phone && <span className="text-xs text-gray-500">{phone}</span>}
            </div>
          </div>
        );
      },
    },
    {
      header: "Trainer",
      accessor: "trainerId",
      render: (row) => {
        const trId = row.trainerId?._id || row.trainerId;
        const trainer =
          row.trainer ||
          trainers.find((t) => t._id === trId) ||
          {};
        const name = trainer.name || row.trainerName || "Trainer";
        const spec = Array.isArray(trainer.specialization)
          ? trainer.specialization.join(", ")
          : trainer.specialization || "";

        return (
          <div>
            <span className="font-medium text-gray-800 block">{name}</span>
            {spec && <span className="text-xs text-gray-500">{spec}</span>}
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

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          placeholder="Filter by date..."
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "", label: "All Statuses" },
            { value: "SCHEDULED", label: "Scheduled" },
            { value: "COMPLETED", label: "Completed" },
            { value: "CANCELLED", label: "Cancelled" },
          ]}
        />
        <Select
          value={trainerFilter}
          onChange={(e) => setTrainerFilter(e.target.value)}
          options={[
            { value: "", label: "All Trainers" },
            ...trainers.map((t) => ({ value: t._id, label: t.name })),
          ]}
        />
      </div>

      <Table
        columns={columns}
        data={sessions}
        emptyMessage={
          loading
            ? "Loading sessions..."
            : "No sessions scheduled. Book a session for an active member!"
        }
        pagination={{
          currentPage: page,
          totalPages: pagination.totalPages,
          totalItems: pagination.total,
          pageSize,
          onPageChange: (newPage) => setPage(newPage),
          onPageSizeChange: (newSize) => {
            setPageSize(newSize);
            setPage(1);
          },
        }}
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

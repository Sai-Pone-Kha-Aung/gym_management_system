import { useState, useEffect } from "react";
import { membershipsApi } from "../../api/memberships.api";
import { membershipPlansApi } from "../../api/membershipPlans.api";
import { membersApi } from "../../api/members.api";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import ConfirmDialog from "../../components/feedback/ConfirmDialog";
import AssignPlanModal from "./components/AssignPlanModal";
import PlansConfigModal from "./components/PlansConfigModal";
import { formatDate } from "../../utils/dateUtils";
import { formatCurrency } from "../../utils/formatters";

export const MembershipsPage = () => {
  const [memberships, setMemberships] = useState([]);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isPlanConfigOpen, setIsPlanConfigOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membershipsRes, membersRes, plansRes] = await Promise.all([
        membershipsApi.getAll().catch(() => []),
        membersApi.getAll().catch(() => []),
        membershipPlansApi.getAll().catch(() => []),
      ]);

      setMemberships(
        Array.isArray(membershipsRes)
          ? membershipsRes
          : membershipsRes?.memberships || [],
      );
      setMembers(
        Array.isArray(membersRes) ? membersRes : membersRes?.members || [],
      );
      setPlans(Array.isArray(plansRes) ? plansRes : plansRes?.plans || []);
    } catch (err) {
      console.error("Failed to load memberships data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async (formData) => {
    setActionLoading(true);
    try {
      await membershipsApi.create(formData);
      setIsAssignOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to assign membership");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePlan = async (planData) => {
    setActionLoading(true);
    try {
      await membershipPlansApi.create(planData);
      setIsPlanConfigOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to create plan");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await membershipsApi.delete(deleteTarget._id);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to remove membership");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: "Member",
      accessor: "memberId",
      render: (row) => (
        <div>
          <span className="font-semibold text-gray-900 block">
            {row.memberId?.name || row.memberName || "Unknown Member"}
          </span>
          <span className="text-xs text-gray-500">
            {row.memberId?.email || ""}
          </span>
        </div>
      ),
    },
    {
      header: "Plan",
      accessor: "planName",
      render: (row) => (
        <span className="font-medium text-gray-800">{row.planName}</span>
      ),
    },
    {
      header: "Price",
      accessor: "price",
      render: (row) => formatCurrency(row.price),
    },
    {
      header: "Duration",
      accessor: "startDate",
      render: (row) => (
        <span className="text-xs text-gray-600">
          {formatDate(row.startDate)} → {formatDate(row.endDate)}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => <Badge status={row.status || "Active"} />,
    },
    {
      header: "Actions",
      accessor: "_id",
      render: (row) => (
        <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>
          Cancel/Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Memberships & Plans
          </h2>
          <p className="text-sm text-gray-500">
            Track active memberships, subscriptions, renewal dates and status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setIsPlanConfigOpen(true)}>
            + New Plan Tier
          </Button>
          <Button onClick={() => setIsAssignOpen(true)}>
            + Assign Membership
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        data={memberships}
        emptyMessage={
          loading
            ? "Loading memberships..."
            : "No active or recorded memberships found."
        }
      />

      <AssignPlanModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onSubmit={handleAssign}
        members={members}
        plans={plans}
        loading={actionLoading}
      />

      <PlansConfigModal
        isOpen={isPlanConfigOpen}
        onClose={() => setIsPlanConfigOpen(false)}
        onSubmit={handleCreatePlan}
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Membership"
        message="Are you sure you want to cancel and remove this membership record?"
        loading={actionLoading}
      />
    </div>
  );
};

export default MembershipsPage;

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { membershipsApi } from "../../api/memberships.api";
import { membershipPlansApi } from "../../api/membershipPlans.api";
import { membersApi } from "../../api/members.api";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Badge from "../../components/ui/Badge";
import ConfirmDialog from "../../components/feedback/ConfirmDialog";
import AssignPlanModal from "./components/AssignPlanModal";
import PlansConfigModal from "./components/PlansConfigModal";
import { formatDate } from "../../utils/dateUtils";
import { formatCurrency } from "../../utils/formatters";
import { useDebounce } from "../../hooks/useDebounce";

export const MembershipsPage = () => {
  const [memberships, setMemberships] = useState([]);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Modals state
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isPlanConfigOpen, setIsPlanConfigOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const [membershipsRes, membersRes, plansRes] = await Promise.all([
        membershipsApi.getAll(params).catch(() => []),
        membersApi.getAll().catch(() => []),
        membershipPlansApi.getAll().catch(() => []),
      ]);

      const mList = Array.isArray(membershipsRes)
        ? membershipsRes
        : membershipsRes?.memberships || [];
      const memList = Array.isArray(membersRes)
        ? membersRes
        : membersRes?.members || [];
      const pList = Array.isArray(plansRes)
        ? plansRes
        : plansRes?.membership_plans || plansRes?.plans || [];

      setMemberships(mList);
      setMembers(memList);
      setPlans(pList);
    } catch (err) {
      console.error("Failed to load memberships data:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const filteredMemberships = memberships.filter((m) => {
    const memberName =
      m.member?.name || m.memberId?.name || m.memberName || "";
    const planName =
      m.plan_name || m.plan?.plan_name || m.planName || "";
    const memberEmail =
      m.member?.email || m.memberId?.email || "";
    const q = debouncedSearch.toLowerCase();
    return (
      memberName.toLowerCase().includes(q) ||
      planName.toLowerCase().includes(q) ||
      memberEmail.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      header: "Member",
      accessor: "member_id",
      render: (row) => {
        const member = row.member || row.memberId || {};
        const name = member.name || row.memberName || "Unknown Member";
        const email = member.email || "";
        const mId = member._id || row.member_id || row.memberId;

        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {name ? name.slice(0, 2) : "M"}
            </div>
            <div>
              {mId ? (
                <Link
                  to={`/members/${mId}`}
                  className="font-semibold text-gray-900 hover:underline block"
                >
                  {name}
                </Link>
              ) : (
                <span className="font-semibold text-gray-900 block">{name}</span>
              )}
              {email && <span className="text-xs text-gray-500">{email}</span>}
            </div>
          </div>
        );
      },
    },
    {
      header: "Plan Tier",
      accessor: "plan_name",
      render: (row) => {
        const pName =
          row.plan_name ||
          row.plan?.plan_name ||
          row.planName ||
          "Membership";
        return (
          <Link
            to={`/memberships/${row._id}`}
            className="font-medium text-gray-900 hover:underline block"
          >
            {pName}
          </Link>
        );
      },
    },
    {
      header: "Price",
      accessor: "amount",
      render: (row) => (
        <span className="font-semibold text-gray-900">
          {formatCurrency(row.amount || row.price)}
        </span>
      ),
    },
    {
      header: "Payment",
      accessor: "payment_status",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <Badge status={row.payment_status || "PAID"}>
            {row.payment_status || "PAID"}
          </Badge>
          <span className="text-[11px] text-gray-500">
            {row.payment_method || "CASH"}
          </span>
        </div>
      ),
    },
    {
      header: "Validity Period",
      accessor: "start_date",
      render: (row) => {
        const start = row.start_date || row.startDate;
        const end = row.end_date || row.endDate;
        return (
          <span className="text-xs text-gray-600 block">
            {formatDate(start)} → {formatDate(end)}
          </span>
        );
      },
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => <Badge status={row.status || "ACTIVE"} />,
    },
    {
      header: "Actions",
      accessor: "_id",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link to={`/memberships/${row._id}`}>
            <Button size="sm" variant="ghost">
              View
            </Button>
          </Link>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setDeleteTarget(row)}
          >
            Cancel/Delete
          </Button>
        </div>
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
            Track active memberships, subscriptions, renewal dates and billing status.
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

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          placeholder="Search by member or plan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "", label: "All Statuses" },
            { value: "ACTIVE", label: "Active" },
            { value: "EXPIRED", label: "Expired" },
            { value: "CANCELLED", label: "Cancelled" },
          ]}
        />
      </div>

      <Table
        columns={columns}
        data={filteredMemberships}
        emptyMessage={
          loading
            ? "Loading memberships..."
            : "No active or recorded memberships found matching your filters."
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
        confirmText="Remove Record"
        confirmVariant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default MembershipsPage;

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { membershipPlansApi } from "../../api/membershipPlans.api";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Badge from "../../components/ui/Badge";
import ConfirmDialog from "../../components/feedback/ConfirmDialog";
import PlansConfigModal from "../memberships/components/PlansConfigModal";
import { formatCurrency } from "../../utils/formatters";
import { formatDate } from "../../utils/dateUtils";
import { useDebounce } from "../../hooks/useDebounce";
import { CreditCard, Sparkles } from "lucide-react";

export const PlansListPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1,
    size: 10,
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        size: pageSize,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;

      const data = await membershipPlansApi.getAll(params);
      const planList = Array.isArray(data)
        ? data
        : data?.membership_plans || data?.plans || [];
      setPlans(planList);

      if (data?.pagination) {
        setPagination({
          total: data.pagination.total ?? planList.length,
          totalPages: data.pagination.totalPage ?? 1,
          currentPage: data.pagination.currentPage ?? page,
          size: data.pagination.size ?? pageSize,
        });
      } else {
        setPagination({
          total: planList.length,
          totalPages: 1,
          currentPage: 1,
          size: pageSize,
        });
      }
    } catch (err) {
      console.error("Failed to load membership plans:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleCreateOrUpdate = async (formData) => {
    setActionLoading(true);
    try {
      if (selectedPlan?._id) {
        await membershipPlansApi.update(selectedPlan._id, formData);
      } else {
        await membershipPlansApi.create(formData);
      }
      setIsModalOpen(false);
      setSelectedPlan(null);
      fetchPlans();
    } catch (err) {
      alert(err.message || "Failed to save plan tier");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await membershipPlansApi.delete(deleteTarget._id);
      setDeleteTarget(null);
      fetchPlans();
    } catch (err) {
      alert(err.message || "Failed to delete plan");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: "Plan Name",
      accessor: "plan_name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            <Sparkles size={16} />
          </div>
          <div>
            <Link
              to={`/membership-plans/${row._id}`}
              className="font-semibold text-gray-900 hover:underline block"
            >
              {row.plan_name}
            </Link>
            <span className="text-xs text-gray-500">
              {row.description || "Full access membership package"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Price",
      accessor: "price",
      render: (row) => (
        <span className="font-semibold text-gray-900">
          {formatCurrency(row.price)}
        </span>
      ),
    },
    {
      header: "Duration",
      accessor: "duration_in_days",
      render: (row) => {
        const days = Number(row.duration_in_days) || 30;
        let label = `${days} days`;
        if (days === 30) label = "1 Month (30 days)";
        else if (days === 90) label = "3 Months (90 days)";
        else if (days === 180) label = "6 Months (180 days)";
        else if (days === 365) label = "1 Year (365 days)";
        return (
          <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
            {label}
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
      header: "Created Date",
      accessor: "createdAt",
      render: (row) => formatDate(row.createdAt),
    },
    {
      header: "Actions",
      accessor: "_id",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link to={`/membership-plans/${row._id}`}>
            <Button size="sm" variant="ghost">
              View
            </Button>
          </Link>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedPlan(row);
              setIsModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setDeleteTarget(row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Navigation Tabs between Memberships and Plans */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <Link
          to="/memberships"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <CreditCard size={16} />
          <span>Member Subscriptions</span>
        </Link>
        <div className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-gray-900 text-white shadow-xs">
          <Sparkles size={16} />
          <span>Plan Tiers & Packages</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Membership Plan Tiers
          </h2>
          <p className="text-sm text-gray-500">
            Configure subscription packages, duration, pricing tiers and member
            perks.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedPlan(null);
            setIsModalOpen(true);
          }}
        >
          + Create Plan Tier
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <Input
            placeholder="Search plans by title, perks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "", label: "All Statuses" },
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
          ]}
        />
      </div>

      <Table
        columns={columns}
        data={plans}
        emptyMessage={
          loading
            ? "Loading plan tiers..."
            : "No membership plans found. Create your first plan tier!"
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

      <PlansConfigModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPlan(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={selectedPlan}
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Plan Tier"
        message={`Are you sure you want to remove plan tier "${deleteTarget?.plan_name}"?`}
        confirmVariant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default PlansListPage;

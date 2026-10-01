import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { trainersApi } from "../../api/trainers.api";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Badge from "../../components/ui/Badge";
import ConfirmDialog from "../../components/feedback/ConfirmDialog";
import TrainerFormModal from "./components/TrainerFormModal";
import { useDebounce } from "../../hooks/useDebounce";

export const TrainersListPage = () => {
  const [trainers, setTrainers] = useState([]);
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

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const fetchTrainers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        size: pageSize,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;

      const data = await trainersApi.getAll(params);
      const trainerList = Array.isArray(data) ? data : data?.trainers || [];
      setTrainers(trainerList);

      if (data?.pagination) {
        setPagination({
          total: data.pagination.total ?? trainerList.length,
          totalPages: data.pagination.totalPage ?? 1,
          currentPage: data.pagination.currentPage ?? page,
          size: data.pagination.size ?? pageSize,
        });
      } else {
        setPagination({
          total: trainerList.length,
          totalPages: 1,
          currentPage: 1,
          size: pageSize,
        });
      }
    } catch (err) {
      console.error("Failed to load trainers:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  const handleCreateOrUpdate = async (formData) => {
    setActionLoading(true);
    try {
      if (selectedTrainer?._id) {
        await trainersApi.update(selectedTrainer._id, formData);
      } else {
        await trainersApi.create(formData);
      }
      setIsFormOpen(false);
      setSelectedTrainer(null);
      fetchTrainers();
    } catch (err) {
      alert(err.message || "Failed to save trainer");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await trainersApi.delete(deleteTarget._id);
      setDeleteTarget(null);
      fetchTrainers();
    } catch (err) {
      alert(err.message || "Failed to delete trainer");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: "Trainer",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
            {row.name ? row.name.slice(0, 2) : "TR"}
          </div>
          <div>
            <Link
              to={`/trainers/${row._id}`}
              className="font-semibold text-gray-900 hover:underline block"
            >
              {row.name}
            </Link>
            <span className="text-xs text-gray-500">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Specialization",
      accessor: "specialization",
      render: (row) => {
        const spec = Array.isArray(row.specialization)
          ? row.specialization.join(", ")
          : row.specialization;
        return (
          <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
            {spec || "General"}
          </span>
        );
      },
    },
    {
      header: "Experience",
      accessor: "experience",
      render: (row) => `${row.experience || 0} years`,
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => <Badge status={row.status || "ACTIVE"} />,
    },
    {
      header: "Phone",
      accessor: "phone",
      render: (row) => row.phone || "-",
    },
    {
      header: "Actions",
      accessor: "_id",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link to={`/trainers/${row._id}`}>
            <Button size="sm" variant="ghost">
              View
            </Button>
          </Link>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedTrainer(row);
              setIsFormOpen(true);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gym Trainers</h2>
          <p className="text-sm text-gray-500">
            Manage fitness coaches, instructors, specializations and experience.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedTrainer(null);
            setIsFormOpen(true);
          }}
        >
          + Add Trainer
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <Input
            placeholder="Search by name, specialization, email..."
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
        data={trainers}
        emptyMessage={
          loading
            ? "Loading trainers..."
            : "No trainers found. Register your first trainer!"
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

      <TrainerFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedTrainer(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={selectedTrainer}
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Trainer"
        message={`Are you sure you want to remove trainer ${deleteTarget?.name}?`}
        loading={actionLoading}
      />
    </div>
  );
};

export default TrainersListPage;

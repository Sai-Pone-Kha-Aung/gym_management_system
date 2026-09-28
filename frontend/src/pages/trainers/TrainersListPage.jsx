import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { trainersApi } from "../../api/trainers.api";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import ConfirmDialog from "../../components/feedback/ConfirmDialog";
import TrainerFormModal from "./components/TrainerFormModal";
import { useDebounce } from "../../hooks/useDebounce";

export const TrainersListPage = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const data = await trainersApi.getAll();
      setTrainers(Array.isArray(data) ? data : data?.trainers || []);
    } catch (err) {
      console.error("Failed to load trainers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

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

  const filteredTrainers = trainers.filter(
    (t) =>
      t.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      t.specialization?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      t.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

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

      <div className="w-full sm:w-72">
        <Input
          placeholder="Search by name or specialization..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table
        columns={columns}
        data={filteredTrainers}
        emptyMessage={
          loading ? "Loading trainers..." : "No trainers found. Register your first trainer!"
        }
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

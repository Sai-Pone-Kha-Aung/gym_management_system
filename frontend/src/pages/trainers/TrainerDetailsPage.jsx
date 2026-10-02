import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { trainersApi } from "../../api/trainers.api";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import ConfirmDialog from "../../components/feedback/ConfirmDialog";
import TrainerFormModal from "./components/TrainerFormModal";
import { formatDate } from "../../utils/dateUtils";
import { formatPhone } from "../../utils/formatters";

export const TrainerDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTrainer = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await trainersApi.getById(id);
      setTrainer(data?.trainer || data);
    } catch (err) {
      console.error("Error loading trainer profile:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTrainer();
  }, [fetchTrainer]);

  const handleUpdate = async (formData) => {
    setActionLoading(true);
    try {
      await trainersApi.update(id, formData);
      setIsEditOpen(false);
      fetchTrainer();
    } catch (err) {
      alert(err.message || "Failed to update trainer");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!trainer) return;
    const newStatus = trainer.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setActionLoading(true);
    try {
      await trainersApi.update(id, { status: newStatus });
      fetchTrainer();
    } catch (err) {
      alert(err.message || "Failed to update trainer status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await trainersApi.delete(id);
      setIsDeleteOpen(false);
      navigate("/trainers");
    } catch (err) {
      alert(err.message || "Failed to delete trainer");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-semibold text-gray-800">Trainer Not Found</h3>
        <p className="text-sm text-gray-500 mt-1">
          The requested trainer could not be found or has been removed.
        </p>
        <Link
          to="/trainers"
          className="text-sm text-gray-900 font-semibold underline mt-4 inline-block"
        >
          ← Back to Trainers
        </Link>
      </div>
    );
  }

  const formatGender = (gender) => {
    if (!gender) return "Not specified";
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  };

  const renderSpecialization = (spec) => {
    if (Array.isArray(spec)) return spec.join(", ");
    return spec || "General Fitness";
  };

  const renderShift = (shift) => {
    if (Array.isArray(shift)) return shift.join(", ");
    return shift || "Flexible / All Shifts";
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/trainers"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Trainers
          </Link>
          <span className="text-gray-300">/</span>
          <h2 className="text-xl font-bold text-gray-900">{trainer.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleToggleStatus}
            disabled={actionLoading}
          >
            {trainer.status === "ACTIVE" ? "Deactivate" : "Activate"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsEditOpen(true)}
          >
            Edit Trainer
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setIsDeleteOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Overview Card */}
        <Card className="flex flex-col items-center text-center p-6 md:col-span-1">
          <div className="w-20 h-20 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-2xl uppercase mb-3 shadow-sm">
            {trainer.name ? trainer.name.slice(0, 2) : "TR"}
          </div>
          <h3 className="text-lg font-bold text-gray-900">{trainer.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{trainer.email}</p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <Badge status={trainer.status || "ACTIVE"} />
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200">
              {renderSpecialization(trainer.specialization)}
            </span>
          </div>

          <div className="w-full mt-6 pt-6 border-t border-gray-100 flex flex-col gap-2.5 text-xs text-left">
            <div className="flex justify-between">
              <span className="text-gray-500">Experience:</span>
              <span className="font-semibold text-gray-800">
                {trainer.experience || 0} years
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone:</span>
              <span className="font-medium text-gray-800">
                {formatPhone(trainer.phone)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Trainer Since:</span>
              <span className="font-medium text-gray-800">
                {formatDate(trainer.createdAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ID:</span>
              <span className="font-mono text-[11px] text-gray-600 truncate max-w-[150px]">
                {trainer._id}
              </span>
            </div>
          </div>
        </Card>

        {/* Right Column: Detailed Sections */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Professional & Personal Details */}
          <Card title="Trainer Information">
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Full Name</span>
                <span className="font-semibold text-gray-900">{trainer.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Email Address</span>
                <span className="font-medium text-gray-900">{trainer.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Phone Number</span>
                <span className="font-medium text-gray-900">
                  {formatPhone(trainer.phone)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Specialization</span>
                <span className="font-medium text-gray-900">
                  {renderSpecialization(trainer.specialization)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Years of Experience</span>
                <span className="font-semibold text-gray-900">
                  {trainer.experience || 0} years
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Assigned Shift</span>
                <span className="font-medium text-gray-900">
                  {renderShift(trainer.shift)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Gender</span>
                <span className="font-medium text-gray-900">
                  {formatGender(trainer.gender)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Date of Birth</span>
                <span className="font-medium text-gray-900">
                  {formatDate(trainer.date_of_birth || trainer.dateOfBirth)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Address</span>
                <span className="font-medium text-gray-900 text-right">
                  {trainer.address || "Not provided"}
                </span>
              </div>
            </div>
          </Card>

          {/* System & Employment Info */}
          <Card title="System & Employment Info">
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Status</span>
                <Badge status={trainer.status || "ACTIVE"} />
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Registered Date</span>
                <span className="font-medium text-gray-900">
                  {formatDate(trainer.createdAt)}
                </span>
              </div>
              {trainer.updatedAt && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(trainer.updatedAt)}
                  </span>
                </div>
              )}
              {trainer.deletedAt && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-rose-500 font-medium">Deactivated At</span>
                  <span className="font-medium text-rose-600">
                    {formatDate(trainer.deletedAt)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Database ID</span>
                <span className="font-mono text-xs text-gray-600">
                  {trainer._id}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Trainer Modal */}
      <TrainerFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
        initialData={trainer}
        loading={actionLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Trainer"
        message={`Are you sure you want to remove trainer ${trainer.name}? Any associated upcoming sessions will be affected.`}
        confirmText="Delete Trainer"
        confirmVariant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default TrainerDetailsPage;

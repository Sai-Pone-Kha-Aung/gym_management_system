import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { membersApi } from "../../api/members.api";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import ConfirmDialog from "../../components/feedback/ConfirmDialog";
import MemberFormModal from "./components/MemberFormModal";
import { formatDate } from "../../utils/dateUtils";
import { formatPhone } from "../../utils/formatters";

export const MemberDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMember = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await membersApi.getById(id);
      setMember(data?.member || data);
    } catch (err) {
      console.error("Error loading member profile:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  const handleUpdate = async (formData) => {
    setActionLoading(true);
    try {
      await membersApi.update(id, formData);
      setIsEditOpen(false);
      fetchMember();
    } catch (err) {
      alert(err.message || "Failed to update member");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!member) return;
    const newStatus = member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setActionLoading(true);
    try {
      await membersApi.update(id, { status: newStatus });
      fetchMember();
    } catch (err) {
      alert(err.message || "Failed to update member status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await membersApi.delete(id);
      setIsDeleteOpen(false);
      navigate("/members");
    } catch (err) {
      alert(err.message || "Failed to delete member");
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

  if (!member) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-semibold text-gray-800">
          Member Not Found
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          The requested member could not be found or has been removed.
        </p>
        <Link
          to="/members"
          className="text-sm text-gray-900 font-semibold underline mt-4 inline-block"
        >
          ← Back to Members
        </Link>
      </div>
    );
  }

  const formatGender = (gender) => {
    if (!gender) return "Not specified";
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/members"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Members
          </Link>
          <span className="text-gray-300">/</span>
          <h2 className="text-xl font-bold text-gray-900">{member.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleToggleStatus}
            disabled={actionLoading}
          >
            {member.status === "ACTIVE" ? "Deactivate" : "Activate"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsEditOpen(true)}
          >
            Edit Member
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
            {member.name ? member.name.slice(0, 2) : "M"}
          </div>
          <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{member.email}</p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <Badge status={member.status || "ACTIVE"} />
            <Badge status={member.membership_type || "UNASSIGNED"}>
              {member.membership_type || "UNASSIGNED"}
            </Badge>
          </div>

          <div className="w-full mt-6 pt-6 border-t border-gray-100 flex flex-col gap-2.5 text-xs text-left">
            <div className="flex justify-between">
              <span className="text-gray-500">Phone:</span>
              <span className="font-medium text-gray-800">
                {formatPhone(member.phone)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Member Since:</span>
              <span className="font-medium text-gray-800">
                {formatDate(member.createdAt || member.joinedDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ID:</span>
              <span className="font-mono text-[11px] text-gray-600 truncate max-w-[150px]">
                {member._id}
              </span>
            </div>
          </div>
        </Card>

        {/* Right Column: Detailed Sections */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Personal Information */}
          <Card title="Personal Information">
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Full Name</span>
                <span className="font-semibold text-gray-900">
                  {member.name}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Email Address</span>
                <span className="font-medium text-gray-900">
                  {member.email}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Phone Number</span>
                <span className="font-medium text-gray-900">
                  {formatPhone(member.phone)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Gender</span>
                <span className="font-medium text-gray-900">
                  {formatGender(member.gender)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Date of Birth</span>
                <span className="font-medium text-gray-900">
                  {formatDate(member.date_of_birth || member.dateOfBirth)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Address</span>
                <span className="font-medium text-gray-900 text-right">
                  {member.address || "Not provided"}
                </span>
              </div>
            </div>
          </Card>

          {/* Membership & System Status */}
          <Card title="Membership & System Info">
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Membership Type</span>
                <Badge status={member.membership_type || "UNASSIGNED"}>
                  {member.membership_type || "UNASSIGNED"}
                </Badge>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Account Status</span>
                <Badge status={member.status || "ACTIVE"} />
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Registered Date</span>
                <span className="font-medium text-gray-900">
                  {formatDate(member.createdAt || member.joinedDate)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Last Updated</span>
                <span className="font-medium text-gray-900">
                  {formatDate(member.updatedAt)}
                </span>
              </div>
              {member.deletedAt && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-rose-500 font-medium">
                    Deactivated At
                  </span>
                  <span className="font-medium text-rose-600">
                    {formatDate(member.deletedAt)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Database ID</span>
                <span className="font-mono text-xs text-gray-600">
                  {member._id}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Member Modal */}
      <MemberFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
        initialData={member}
        loading={actionLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Member"
        message={`Are you sure you want to delete ${member.name}? This will remove all their records.`}
        confirmText="Delete Member"
        confirmVariant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default MemberDetailsPage;

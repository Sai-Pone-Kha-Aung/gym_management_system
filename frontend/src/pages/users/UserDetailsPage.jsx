import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { usersApi } from "../../api/users.api";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import ConfirmDialog from "../../components/feedback/ConfirmDialog";
import UserFormModal from "./components/UserFormModal";
import { formatDate } from "../../utils/dateUtils";

export const UserDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUserDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await usersApi.getById(id);
      setUser(data?.user || data);
    } catch (err) {
      console.error("Error loading user profile:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const handleUpdate = async (formData) => {
    setActionLoading(true);
    try {
      await usersApi.update(id, formData);
      setIsEditOpen(false);
      fetchUserDetails();
    } catch (err) {
      alert(err.message || "Failed to update user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setActionLoading(true);
    try {
      await usersApi.update(id, { status: newStatus });
      fetchUserDetails();
    } catch (err) {
      alert(err.message || "Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await usersApi.delete(id, "soft");
      setIsDeleteOpen(false);
      navigate("/users");
    } catch (err) {
      alert(err.message || "Failed to delete user");
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

  if (!user) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-semibold text-gray-800">User Not Found</h3>
        <p className="text-sm text-gray-500 mt-1">
          The requested user account does not exist or has been removed.
        </p>
        <Link
          to="/users"
          className="text-sm text-gray-900 font-semibold underline mt-4 inline-block"
        >
          ← Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/users"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Users
          </Link>
          <span className="text-gray-300">/</span>
          <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleToggleStatus}
            disabled={actionLoading}
          >
            {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsEditOpen(true)}
          >
            Edit User
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="flex flex-col items-center text-center p-6 md:col-span-1">
          <div className="w-20 h-20 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-2xl uppercase mb-3 shadow-sm">
            {user.name ? user.name.slice(0, 2) : "U"}
          </div>
          <h3 className="text-base font-bold text-gray-900">{user.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
          <div className="flex items-center gap-2 mt-4">
            <Badge status={user.role || "STAFF"} />
            <Badge status={user.status || "ACTIVE"} />
          </div>
        </Card>

        {/* Account Details Card */}
        <Card title="Account Details" className="md:col-span-2">
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Full Name</span>
              <span className="font-semibold text-gray-900">{user.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Email Address</span>
              <span className="font-medium text-gray-900">{user.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">System Role</span>
              <Badge status={user.role || "STAFF"} />
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Account Status</span>
              <Badge status={user.status || "ACTIVE"} />
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">User ID</span>
              <span className="font-mono text-xs text-gray-600">
                {user._id || user.id}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Account Created</span>
              <span className="font-medium text-gray-900">
                {formatDate(user.createdAt)}
              </span>
            </div>
            {user.updatedAt && (
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Last Updated</span>
                <span className="font-medium text-gray-900">
                  {formatDate(user.updatedAt)}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      <UserFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
        initialData={user}
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete User Account"
        message={`Are you sure you want to delete ${user.name}? They will no longer be able to log in.`}
        confirmText="Delete Account"
        confirmVariant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default UserDetailsPage;

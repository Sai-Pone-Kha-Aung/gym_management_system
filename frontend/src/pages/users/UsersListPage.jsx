import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { usersApi } from "../../api/users.api";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Badge from "../../components/ui/Badge";
import ConfirmDialog from "../../components/feedback/ConfirmDialog";
import UserFormModal from "./components/UserFormModal";
import { formatDate } from "../../utils/dateUtils";
import { useDebounce } from "../../hooks/useDebounce";

export const UsersListPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await usersApi.getAll(params);
      const userList = Array.isArray(res) ? res : res?.users || [];
      setUsers(userList);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateOrUpdate = async (formData) => {
    setActionLoading(true);
    try {
      if (selectedUser?._id) {
        await usersApi.update(selectedUser._id, formData);
      } else {
        await usersApi.create(formData);
      }
      setIsFormOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.message || "Failed to save user account");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await usersApi.delete(deleteTarget._id, "soft");
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      alert(err.message || "Failed to remove user account");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: "User Account",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
            {row.name ? row.name.slice(0, 2) : "U"}
          </div>
          <div>
            <Link
              to={`/users/${row._id}`}
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
      header: "Role",
      accessor: "role",
      render: (row) => <Badge status={row.role || "STAFF"} />,
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
          <Link to={`/users/${row._id}`}>
            <Button size="sm" variant="ghost">
              View
            </Button>
          </Link>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedUser(row);
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
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500">
            Manage administrative staff, receptionists, coaches and system roles.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedUser(null);
            setIsFormOpen(true);
          }}
        >
          + Add New User
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          options={[
            { value: "", label: "All Roles" },
            { value: "ADMIN", label: "Admin" },
            { value: "STAFF", label: "Staff" },
          ]}
        />
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
        data={users}
        emptyMessage={
          loading ? "Loading users..." : "No users found matching your criteria."
        }
      />

      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={selectedUser}
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Deactivate / Delete User"
        message={`Are you sure you want to deactivate ${deleteTarget?.name}? They will lose access to the system.`}
        confirmText="Deactivate User"
        confirmVariant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default UsersListPage;

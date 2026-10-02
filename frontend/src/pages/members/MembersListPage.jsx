import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { membersApi } from "../../api/members.api";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Badge from "../../components/ui/Badge";
import ConfirmDialog from "../../components/feedback/ConfirmDialog";
import MemberFormModal from "./components/MemberFormModal";
import { formatDate } from "../../utils/dateUtils";
import { useDebounce } from "../../hooks/useDebounce";

export const MembersListPage = () => {
  const [members, setMembers] = useState([]);
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
  const [selectedMember, setSelectedMember] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        size: pageSize,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;

      const data = await membersApi.getAll(params);
      const memberList = Array.isArray(data) ? data : data?.members || [];
      setMembers(memberList);

      if (data?.pagination) {
        setPagination({
          total: data.pagination.total ?? memberList.length,
          totalPages: data.pagination.totalPage ?? 1,
          currentPage: data.pagination.currentPage ?? page,
          size: data.pagination.size ?? pageSize,
        });
      } else {
        setPagination({
          total: memberList.length,
          totalPages: 1,
          currentPage: 1,
          size: pageSize,
        });
      }
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleCreateOrUpdate = async (formData) => {
    setActionLoading(true);
    try {
      if (selectedMember?._id) {
        await membersApi.update(selectedMember._id, formData);
      } else {
        await membersApi.create(formData);
      }
      setIsFormOpen(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (err) {
      alert(err.message || "Failed to save member");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await membersApi.delete(deleteTarget._id);
      setDeleteTarget(null);
      fetchMembers();
    } catch (err) {
      alert(err.message || "Failed to delete member");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: "Member",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
            {row.name ? row.name.slice(0, 2) : "MB"}
          </div>
          <div>
            <Link
              to={`/members/${row._id}`}
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
      header: "Plan Tier",
      accessor: "membership_type",
      render: (row) => (
        <Badge status={row.membership_type || "UNASSIGNED"}>
          {row.membership_type || "UNASSIGNED"}
        </Badge>
      ),
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
      header: "Gender",
      accessor: "gender",
      render: (row) => {
        const gender = row.gender || "";
        return gender
          ? gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase()
          : "-";
      },
    },
    {
      header: "Joined Date",
      accessor: "joinedDate",
      render: (row) => formatDate(row.joinedDate || row.createdAt),
    },
    {
      header: "Actions",
      accessor: "_id",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link to={`/members/${row._id}`}>
            <Button size="sm" variant="ghost">
              View
            </Button>
          </Link>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedMember(row);
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
          <h2 className="text-2xl font-bold text-gray-900">Gym Members</h2>
          <p className="text-sm text-gray-500">
            View, search, register and manage all gym athlete profiles.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedMember(null);
            setIsFormOpen(true);
          }}
        >
          + Add Member
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <Input
            placeholder="Search by name, email, phone..."
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
        data={members}
        emptyMessage={
          loading
            ? "Loading members..."
            : "No members found. Add your first member!"
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

      <MemberFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedMember(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={selectedMember}
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Member"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This will remove all their records.`}
        loading={actionLoading}
      />
    </div>
  );
};

export default MembersListPage;

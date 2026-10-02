import React, { useState, useEffect } from "react";
import { membersApi } from "../../api/members.api";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import ConfirmDialog from "../../components/feedback/ConfirmDialog";
import MemberFormModal from "./components/MemberFormModal";
import { formatDate } from "../../utils/dateUtils";
import { useDebounce } from "../../hooks/useDebounce";

export const MembersListPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await membersApi.getAll();
      setMembers(Array.isArray(data) ? data : data?.members || []);
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

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

  const filteredMembers = members.filter(
    (m) =>
      m.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      m.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      m.phone?.includes(debouncedSearch),
  );

  const columns = [
    {
      header: "Member Name",
      accessor: "name",
      render: (row) => (
        <div>
          <span className="font-semibold text-gray-900 block">{row.name}</span>
          <span className="text-xs text-gray-500">{row.email}</span>
        </div>
      ),
    },
    {
      header: "Membership Plan",
      accessor: "membership_type",
    },
    {
      header: "Phone",
      accessor: "phone",
    },
    {
      header: "Gender",
      accessor: "gender",
      render: (row) => {
        const gender = row.gender || "";
        return gender.charAt(0).toUpperCase() + gender.slice(1);
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

      <div className="w-full sm:w-72">
        <Input
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table
        columns={columns}
        data={filteredMembers}
        emptyMessage={
          loading
            ? "Loading members..."
            : "No members found. Add your first member!"
        }
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

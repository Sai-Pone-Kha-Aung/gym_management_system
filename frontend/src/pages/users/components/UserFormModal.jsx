import React, { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";

export const UserFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
    status: "ACTIVE",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        password: "", // do not fill password on edit
        role: initialData.role || "STAFF",
        status: initialData.status || "ACTIVE",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "STAFF",
        status: "ACTIVE",
      });
    }
    setError("");
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim() || !formData.email.trim()) {
      setError("Name and Email are required.");
      return;
    }

    if (!initialData && (!formData.password || formData.password.length < 6)) {
      setError("Password is required and must be at least 6 characters.");
      return;
    }

    if (initialData && formData.password && formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // Clean payload: if editing and password is empty, don't send empty password
    const payload = { ...formData };
    if (initialData && !payload.password) {
      delete payload.password;
    }

    onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit User Account" : "Add New User / Staff"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
            {error}
          </div>
        )}

        <Input
          id="name"
          label="Full Name"
          required
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Sarah Connor"
        />

        <Input
          id="email"
          label="Email Address"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          placeholder="sarah@gym.com"
        />

        <Input
          id="password"
          label={initialData ? "New Password (optional)" : "Password"}
          type="password"
          required={!initialData}
          value={formData.password}
          onChange={handleChange}
          placeholder={initialData ? "Leave blank to keep existing password" : "•••••••• (min 6 chars)"}
          helperText={
            initialData
              ? "Leave blank if you don't want to change the password."
              : "Minimum 6 characters."
          }
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            id="role"
            label="Role"
            value={formData.role}
            onChange={handleChange}
            options={[
              { value: "STAFF", label: "Staff" },
              { value: "ADMIN", label: "Admin" },
            ]}
          />

          <Select
            id="status"
            label="Account Status"
            value={formData.status}
            onChange={handleChange}
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
          />
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : initialData ? "Save Changes" : "Create User"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;

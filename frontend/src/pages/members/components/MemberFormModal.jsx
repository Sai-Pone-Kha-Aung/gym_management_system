import React, { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";

export const MemberFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "male",
    dateOfBirth: "",
    address: "",
  });

  useEffect(() => {
    if (initialData) {
      const rawDob = initialData.date_of_birth || initialData.dateOfBirth;
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        gender: initialData.gender?.toLowerCase() || "male",
        dateOfBirth: rawDob
          ? new Date(rawDob).toISOString().split("T")[0]
          : "",
        address: initialData.address || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        gender: "male",
        dateOfBirth: "",
        address: "",
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      date_of_birth: formData.dateOfBirth,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Member" : "Add New Member"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="name"
          label="Full Name"
          required
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Alex Johnson"
        />
        <Input
          id="email"
          label="Email Address"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          placeholder="alex@example.com"
        />
        <Input
          id="phone"
          label="Phone Number"
          type="tel"
          required
          value={formData.phone}
          onChange={handleChange}
          placeholder="e.g. 555-0192"
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            id="gender"
            label="Gender"
            value={formData.gender}
            onChange={handleChange}
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "other", label: "Other" },
            ]}
          />
          <Input
            id="dateOfBirth"
            label="Date of Birth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
          />
        </div>
        <Input
          id="address"
          label="Address"
          value={formData.address}
          onChange={handleChange}
          placeholder="e.g. 1200 Grand Ave, Los Angeles, CA"
        />

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : initialData ? "Save Changes" : "Create Member"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MemberFormModal;

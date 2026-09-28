import React, { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

export const TrainerFormModal = ({
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
    specialization: "",
    experience: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        specialization: initialData.specialization || "",
        experience: initialData.experience ?? "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        specialization: "",
        experience: "",
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
      experience: Number(formData.experience) || 0,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Trainer Profile" : "Register New Trainer"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="name"
          label="Full Name"
          required
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Marcus Vance"
        />
        <Input
          id="email"
          label="Email Address"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          placeholder="marcus@gym.com"
        />
        <Input
          id="phone"
          label="Phone Number"
          type="tel"
          required
          value={formData.phone}
          onChange={handleChange}
          placeholder="e.g. 555-0184"
        />
        <Input
          id="specialization"
          label="Specialization"
          required
          value={formData.specialization}
          onChange={handleChange}
          placeholder="e.g. Powerlifting, CrossFit, Rehab"
        />
        <Input
          id="experience"
          label="Years of Experience"
          type="number"
          min="0"
          required
          value={formData.experience}
          onChange={handleChange}
          placeholder="e.g. 5"
        />

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : initialData ? "Save Changes" : "Create Trainer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TrainerFormModal;

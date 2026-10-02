import { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
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
    gender: "male",
    dateOfBirth: "",
    address: "",
    shift: "Morning",
  });

  useEffect(() => {
    if (initialData) {
      const rawDob = initialData.date_of_birth || initialData.dateOfBirth;
      const spec = Array.isArray(initialData.specialization)
        ? initialData.specialization.join(", ")
        : initialData.specialization || "";
      const sh = Array.isArray(initialData.shift)
        ? initialData.shift.join(", ")
        : initialData.shift || "Morning";

      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        specialization: spec,
        experience: initialData.experience ?? "",
        gender: initialData.gender?.toLowerCase() || "male",
        dateOfBirth: rawDob
          ? new Date(rawDob).toISOString().split("T")[0]
          : "",
        address: initialData.address || "",
        shift: sh,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        specialization: "",
        experience: "",
        gender: "male",
        dateOfBirth: "",
        address: "",
        shift: "Morning",
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
      date_of_birth: formData.dateOfBirth,
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
        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="specialization"
            label="Specialization"
            required
            value={formData.specialization}
            onChange={handleChange}
            placeholder="e.g. Powerlifting, CrossFit"
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
        </div>

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

        <div className="grid grid-cols-2 gap-4">
          <Select
            id="shift"
            label="Work Shift"
            value={formData.shift}
            onChange={handleChange}
            options={[
              { value: "Morning", label: "Morning (06:00 - 14:00)" },
              { value: "Evening", label: "Evening (14:00 - 22:00)" },
              { value: "Full-day", label: "Full-day" },
            ]}
          />
          <Input
            id="address"
            label="Address"
            value={formData.address}
            onChange={handleChange}
            placeholder="e.g. 450 Gym St, CA"
          />
        </div>

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

import { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

export const PlansConfigModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    plan_name: "",
    price: "",
    duration_in_days: 30,
    description: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        plan_name: initialData.plan_name || "",
        price: initialData.price || "",
        duration_in_days: initialData.duration_in_days || 30,
        description: initialData.description || "",
      });
    } else {
      setFormData({
        plan_name: "",
        price: "",
        duration_in_days: 30,
        description: "",
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      plan_name: formData.plan_name,
      price: Number(formData.price) || 0,
      duration_in_days: Number(formData.duration_in_days) || 30,
      description: formData.description,
    });
  };

  const isEditing = Boolean(initialData?._id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Membership Tier" : "Create Membership Tier"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="plan_name"
          label="Plan Title"
          required
          value={formData.plan_name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, plan_name: e.target.value }))
          }
          placeholder="e.g. Annual VIP Pass"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="price"
            label="Price ($)"
            type="number"
            min="0"
            step="0.01"
            required
            value={formData.price}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, price: e.target.value }))
            }
            placeholder="e.g. 99"
          />
          <Input
            id="duration_in_days"
            label="Duration (Days)"
            type="number"
            min="1"
            required
            value={formData.duration_in_days}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                duration_in_days: e.target.value,
              }))
            }
            placeholder="e.g. 365"
          />
        </div>
        <Input
          id="description"
          label="Description / Perks"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Unlimited gym access, locker, sauna"
        />

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
              ? "Save Changes"
              : "Save Plan Tier"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PlansConfigModal;

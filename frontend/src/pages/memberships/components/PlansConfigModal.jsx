import React, { useState } from "react";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

export const PlansConfigModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    durationDays: 30,
    description: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      price: Number(formData.price) || 0,
      durationDays: Number(formData.durationDays) || 30,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Membership Tier">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="name"
          label="Plan Title"
          required
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="e.g. Annual VIP Pass"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="price"
            label="Price ($)"
            type="number"
            min="0"
            required
            value={formData.price}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, price: e.target.value }))
            }
            placeholder="e.g. 99"
          />
          <Input
            id="durationDays"
            label="Duration (Days)"
            type="number"
            min="1"
            required
            value={formData.durationDays}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, durationDays: e.target.value }))
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
            {loading ? "Creating..." : "Save Plan Tier"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PlansConfigModal;

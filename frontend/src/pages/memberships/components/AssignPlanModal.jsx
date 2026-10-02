import React, { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";

export const AssignPlanModal = ({
  isOpen,
  onClose,
  onSubmit,
  members = [],
  plans = [],
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    memberId: "",
    planName: "",
    price: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    status: "Active",
  });

  useEffect(() => {
    if (isOpen) {
      const defaultMember = members[0]?._id || "";
      const defaultPlan = plans[0]?.name || "Monthly Basic";
      const defaultPrice = plans[0]?.price || 49;
      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + 30);

      setFormData({
        memberId: defaultMember,
        planName: defaultPlan,
        price: defaultPrice,
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
        status: "Active",
      });
    }
  }, [isOpen, members, plans]);

  const handlePlanChange = (e) => {
    const selectedPlanName = e.target.value;
    const plan = plans.find((p) => p.name === selectedPlanName);
    const start = new Date(formData.startDate || new Date());
    const end = new Date(start);
    const durationDays = plan?.durationDays || 30;
    end.setDate(start.getDate() + durationDays);

    setFormData((prev) => ({
      ...prev,
      planName: selectedPlanName,
      price: plan ? plan.price : prev.price,
      endDate: end.toISOString().split("T")[0],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      price: Number(formData.price) || 0,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Membership Plan">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select
          id="memberId"
          label="Select Member"
          required
          value={formData.memberId}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, memberId: e.target.value }))
          }
          options={members.map((m) => ({
            value: m._id,
            label: `${m.name} (${m.email})`,
          }))}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="planName"
            label="Plan Name"
            required
            value={formData.planName}
            onChange={handlePlanChange}
            placeholder="e.g. Monthly Basic"
          />
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
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="startDate"
            label="Start Date"
            type="date"
            required
            value={formData.startDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, startDate: e.target.value }))
            }
          />
          <Input
            id="endDate"
            label="End Date"
            type="date"
            required
            value={formData.endDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, endDate: e.target.value }))
            }
          />
        </div>

        <Select
          id="status"
          label="Initial Status"
          value={formData.status}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, status: e.target.value }))
          }
          options={[
            { value: "Active", label: "Active" },
            { value: "Pending", label: "Pending" },
          ]}
        />

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Assigning..." : "Assign Plan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignPlanModal;

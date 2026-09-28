import { useState, useEffect } from "react";
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
    member_id: "",
    plan_id: "",
    payment_method: "CASH",
    payment_status: "PAID",
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (isOpen) {
      const defaultMember = members[0]?._id || "";
      const defaultPlan = plans[0]?._id || "";
      const defaultPrice = plans[0]?.price || 49;

      setFormData({
        member_id: defaultMember,
        plan_id: defaultPlan,
        payment_method: "CASH",
        payment_status: "PAID",
        amount: defaultPrice,
        payment_date: new Date().toISOString().split("T")[0],
      });
    }
  }, [isOpen, members, plans]);

  const handlePlanChange = (e) => {
    const selectedPlanId = e.target.value;
    const plan = plans.find((p) => p._id === selectedPlanId);

    setFormData((prev) => ({
      ...prev,
      plan_id: selectedPlanId,
      amount: plan ? plan.price : prev.amount,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.member_id || !formData.plan_id) {
      alert("Please select both a member and a membership plan.");
      return;
    }

    onSubmit({
      member_id: formData.member_id,
      plan_id: formData.plan_id,
      payment_method: formData.payment_method,
      amount: Number(formData.amount) || 0,
      payment_status: formData.payment_status,
      payment_date: formData.payment_date,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Membership Plan">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select
          id="member_id"
          label="Select Member"
          required
          value={formData.member_id}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, member_id: e.target.value }))
          }
          options={members.map((m) => ({
            value: m._id,
            label: `${m.name} (${m.email})`,
          }))}
        />

        <Select
          id="plan_id"
          label="Select Plan Tier"
          required
          value={formData.plan_id}
          onChange={handlePlanChange}
          options={plans.map((p) => ({
            value: p._id,
            label: `${p.plan_name || p.name} — $${p.price} (${p.duration_in_days || p.durationDays || 30} days)`,
          }))}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="amount"
            label="Amount / Price ($)"
            type="number"
            min="0"
            required
            value={formData.amount}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, amount: e.target.value }))
            }
          />
          <Input
            id="payment_date"
            label="Payment Date"
            type="date"
            required
            value={formData.payment_date}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                payment_date: e.target.value,
              }))
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            id="payment_method"
            label="Payment Method"
            value={formData.payment_method}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                payment_method: e.target.value,
              }))
            }
            options={[
              { value: "CASH", label: "Cash" },
              { value: "CREDIT_CARD", label: "Credit Card" },
              { value: "DEBIT_CARD", label: "Debit Card" },
              { value: "BANK_TRANSFER", label: "Bank Transfer" },
              { value: "QR_CODE", label: "QR Code" },
            ]}
          />

          <Select
            id="payment_status"
            label="Payment Status"
            value={formData.payment_status}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                payment_status: e.target.value,
              }))
            }
            options={[
              { value: "PAID", label: "Paid" },
              { value: "PENDING", label: "Pending" },
            ]}
          />
        </div>

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

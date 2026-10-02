import React, { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";

export const BookSessionModal = ({
  isOpen,
  onClose,
  onSubmit,
  members = [],
  trainers = [],
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    memberId: "",
    trainerId: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    duration: 60,
    status: "Scheduled",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        memberId: members[0]?._id || "",
        trainerId: trainers[0]?._id || "",
        date: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        duration: 60,
        status: "Scheduled",
      });
    }
  }, [isOpen, members, trainers]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      duration: Number(formData.duration) || 60,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Book Training Session">
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

        <Select
          id="trainerId"
          label="Select Trainer"
          required
          value={formData.trainerId}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, trainerId: e.target.value }))
          }
          options={trainers.map((t) => ({
            value: t._id,
            label: `${t.name} (${t.specialization || "Coach"})`,
          }))}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="date"
            label="Session Date"
            type="date"
            required
            value={formData.date}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, date: e.target.value }))
            }
          />
          <Input
            id="startTime"
            label="Start Time"
            type="time"
            required
            value={formData.startTime}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, startTime: e.target.value }))
            }
          />
        </div>

        <Input
          id="duration"
          label="Duration (Minutes)"
          type="number"
          min="15"
          step="15"
          required
          value={formData.duration}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, duration: e.target.value }))
          }
        />

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Scheduling..." : "Schedule Session"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default BookSessionModal;

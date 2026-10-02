import React from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to perform this action?",
  confirmText = "Delete",
  confirmVariant = "danger",
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex items-center justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Processing..." : confirmText}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;

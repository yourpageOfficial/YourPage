"use client";

import { Button } from "./button";
import { ConfirmDialog } from "./confirm-dialog";

interface UnsavedChangesModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

export function UnsavedChangesModal({
  open,
  onConfirm,
  onCancel,
  title = "Unsaved Changes",
  message = "You have unsaved changes. Are you sure you want to leave?",
}: UnsavedChangesModalProps) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onCancel}
      onConfirm={onConfirm}
      title={title}
      description={message}
      confirmText="Leave"
      variant="destructive"
    />
  );
}

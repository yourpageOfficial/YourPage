"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ControlledProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  variant?: "default" | "destructive";
  children?: never;
}

interface UncontrolledProps {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  children: (open: () => void) => React.ReactNode;
  open?: never;
  onClose?: never;
}

type Props = ControlledProps | UncontrolledProps;

export function ConfirmDialog(props: Props) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = "open" in props && props.open !== undefined;
  const isOpen = isControlled ? props.open : internalOpen;
  const close = isControlled ? props.onClose! : () => setInternalOpen(false);
  const msg = isControlled ? (props as ControlledProps).description : (props as UncontrolledProps).message;
  const label = isControlled ? (props as ControlledProps).confirmText || "Ya" : (props as UncontrolledProps).confirmLabel || "Ya";

  return (
    <>
      {!isControlled && (props as UncontrolledProps).children(() => setInternalOpen(true))}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={close} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <h3 className="font-semibold text-lg">{props.title}</h3>
            {msg && <p className="text-sm text-gray-600 dark:text-gray-400">{msg}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={close}>Batal</Button>
              <Button variant={props.variant || "destructive"} size="sm" onClick={() => { props.onConfirm(); close(); }}>{label}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

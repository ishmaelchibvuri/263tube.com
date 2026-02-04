"use client";

import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface StrictConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmationPhrase: string;
  confirmText?: string;
  cancelText?: string;
}

export function StrictConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmationPhrase,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: StrictConfirmationModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [isConfirmEnabled, setIsConfirmEnabled] = useState(false);

  // Reset input when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setInputValue("");
      setIsConfirmEnabled(false);
    }
  }, [isOpen]);

  // Check if input matches confirmation phrase
  useEffect(() => {
    setIsConfirmEnabled(inputValue === confirmationPhrase);
  }, [inputValue, confirmationPhrase]);

  const handleConfirm = () => {
    if (isConfirmEnabled) {
      onConfirm();
      onClose();
    }
  };

  const handleClose = () => {
    setInputValue("");
    setIsConfirmEnabled(false);
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-red-100 rounded-full p-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-red-900">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-red-900 mb-2">
              This action cannot be undone!
            </p>
            <p className="text-sm text-red-700">
              To confirm, please type <span className="font-mono font-bold">{confirmationPhrase}</span> below:
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation-input" className="text-sm font-medium">
              Confirmation phrase
            </Label>
            <Input
              id="confirmation-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Type "${confirmationPhrase}" to confirm`}
              className="font-mono"
              autoComplete="off"
              autoFocus
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmEnabled}
            className={`${
              isConfirmEnabled
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-600"
                : "bg-gray-300 cursor-not-allowed hover:bg-gray-300"
            }`}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

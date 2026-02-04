"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  actionText?: string;
  variant?: "default" | "success" | "error" | "warning";
}

export function AlertModal({
  isOpen,
  onClose,
  title,
  description,
  actionText = "OK",
  variant = "default",
}: AlertModalProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "bg-green-600 hover:bg-green-700 focus:ring-green-600";
      case "error":
        return "bg-red-600 hover:bg-red-700 focus:ring-red-600";
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 focus:ring-amber-600";
      default:
        return "";
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose} className={getVariantStyles()}>
            {actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

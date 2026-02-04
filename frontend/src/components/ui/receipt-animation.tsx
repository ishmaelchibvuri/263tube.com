"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, Receipt } from "lucide-react";

interface ReceiptAnimationProps {
  show: boolean;
  amount?: number;
  description?: string;
  onComplete?: () => void;
  className?: string;
}

/**
 * Digital receipt animation for transaction confirmation
 * Provides skeuomorphic feedback mimicking physical receipt
 * Part of the Trust Stack design system
 */
function ReceiptAnimation({
  show,
  amount,
  description,
  onComplete,
  className,
}: ReceiptAnimationProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "fixed inset-x-4 top-20 z-50 mx-auto max-w-sm",
            className
          )}
        >
          <div className="relative overflow-hidden rounded-lg border border-green-200 bg-white shadow-xl">
            {/* Receipt header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  <span className="font-semibold">Payment Confirmed</span>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white"
                >
                  <Check className="h-4 w-4 text-green-600" />
                </motion.div>
              </div>
            </div>

            {/* Receipt body */}
            <div className="p-4">
              {/* Dotted line separator */}
              <div className="mb-3 border-b border-dashed border-gray-300" />

              <div className="space-y-2">
                {description && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Description</span>
                    <span className="font-medium text-gray-900">{description}</span>
                  </div>
                )}

                {amount !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium text-gray-900">
                    {new Date().toLocaleDateString("en-ZA")}
                  </span>
                </div>
              </div>

              {/* Dotted line separator */}
              <div className="mt-3 border-b border-dashed border-gray-300" />

              {/* Trust message */}
              <p className="mt-3 text-center text-xs text-gray-400">
                Transaction secured by QuickBudget
              </p>
            </div>

            {/* Torn edge effect */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-[linear-gradient(135deg,transparent_25%,white_25%,white_50%,transparent_50%,transparent_75%,white_75%)] bg-[length:8px_8px]" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Simple success toast for quick confirmations
 */
interface SuccessToastProps {
  show: boolean;
  message: string;
  onComplete?: () => void;
}

function SuccessToast({ show, message, onComplete }: SuccessToastProps) {
  React.useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed inset-x-4 top-4 z-50 mx-auto max-w-sm"
        >
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 shadow-lg">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { ReceiptAnimation, SuccessToast };

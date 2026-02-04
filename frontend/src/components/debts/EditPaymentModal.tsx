"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Debt, PaymentRecord } from "@/types";
import { Loader2, DollarSign, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { toast } from "sonner";

/**
 * Zod schema for payment form validation
 */
const PaymentFormSchema = z.object({
  amount: z.number()
    .positive("Payment amount must be greater than 0")
    .finite("Payment amount must be a valid number"),
  paymentDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Payment date must be in YYYY-MM-DD format")
    .refine((date) => {
      const paymentDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      return paymentDate <= today;
    }, "Payment date cannot be in the future"),
  notes: z.string().optional(),
});

interface EditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
  payment: PaymentRecord | null;
  onPaymentUpdated: () => void;
}

export function EditPaymentModal({
  isOpen,
  onClose,
  debt,
  payment,
  onPaymentUpdated,
}: EditPaymentModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with payment data when payment changes
  useEffect(() => {
    if (payment) {
      setAmount(payment.amount.toString());
      setPaymentDate(payment.paymentDate);
      setNotes(payment.notes || "");
    }
  }, [payment]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!debt || !payment) return;

    const amountNum = parseFloat(amount);

    // Validate form data with Zod
    const validationResult = PaymentFormSchema.safeParse({
      amount: amountNum,
      paymentDate,
      notes: notes || undefined,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      setError(firstError?.message || "Validation error");
      return;
    }

    // Calculate what the balance would be if we remove this payment and add the new one
    // This is a rough validation - the backend will handle the actual balance recalculation
    const balanceAfterRemovingOldPayment = debt.currentBalance + payment.amount;
    if (amountNum > balanceAfterRemovingOldPayment) {
      setError(`Payment amount cannot exceed the recalculated balance (${formatCurrency(balanceAfterRemovingOldPayment)})`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Import the API client
      const { api } = await import("@/lib/api-client-debts");

      await api.payments.updatePayment(
        payment.paymentId,
        debt.debtId,
        payment.paymentDate,
        {
          amount: validationResult.data.amount,
          notes: validationResult.data.notes,
        }
      );

      // Close modal
      onClose();

      // Show success toast
      toast.success("Payment updated successfully", {
        description: `Payment of ${formatCurrency(validationResult.data.amount)} has been updated`,
      });

      // Notify parent to refresh data
      onPaymentUpdated();
    } catch (err: any) {
      console.error("Error updating payment:", err);
      setError(err.message || "Failed to update payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setError(null);
      onClose();
    }
  };

  if (!debt || !payment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Edit Payment
          </DialogTitle>
          <DialogDescription>
            Update payment details for {debt.creditor} - {debt.debtName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Balance Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-900">Current Balance:</span>
              <span className="text-lg font-bold text-blue-900">
                {formatCurrency(debt.currentBalance)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-blue-700">Original Payment:</span>
              <span className="text-sm font-semibold text-blue-700">
                {formatCurrency(payment.amount)}
              </span>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payment Amount *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                R
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-8"
                required
                disabled={submitting}
              />
            </div>
            <p className="text-xs text-gray-500">
              Enter the updated payment amount
            </p>
          </div>

          {/* Payment Date - Read Only */}
          <div className="space-y-2">
            <Label htmlFor="paymentDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Payment Date
            </Label>
            <Input
              id="paymentDate"
              type="text"
              value={paymentDate ? format(new Date(paymentDate), 'MMM d, yyyy') : ''}
              disabled
              className="bg-gray-100"
            />
            <p className="text-xs text-gray-500">
              Payment date cannot be changed
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Reference number, payment method, etc."
              rows={3}
              disabled={submitting}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-900">
              <strong>Note:</strong> Updating this payment will recalculate the debt balance and payment allocation
              according to NCA Section 126.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !amount}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Payment'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Debt } from "@/types";
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

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
  onPaymentRecorded: () => void;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  debt,
  onPaymentRecorded,
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    if (!debt) return;

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

    // Additional business validation
    if (amountNum > debt.currentBalance) {
      setError(`Payment amount cannot exceed current balance (${formatCurrency(debt.currentBalance)})`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Import the API client
      const { api } = await import("@/lib/api-client-debts");

      const result = await api.payments.logPayment(
        debt.debtId,
        validationResult.data.amount,
        validationResult.data.paymentDate,
        {
          notes: validationResult.data.notes,
          paymentType: 'manual',
          paymentSource: 'manual_entry'
        }
      );

      // Reset form
      setAmount("");
      setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
      setNotes("");

      // Close modal
      onClose();

      // Show success toast
      const isPaidOff = result.balanceAfterPayment === 0;
      toast.success("Payment recorded successfully", {
        description: isPaidOff
          ? `Congratulations! ${debt.creditor} - ${debt.debtName} is now paid off!`
          : `Payment of ${formatCurrency(validationResult.data.amount)} has been recorded`,
      });

      // Notify parent to refresh data
      onPaymentRecorded();
    } catch (err: any) {
      console.error("Error recording payment:", err);
      setError(err.message || "Failed to record payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setAmount("");
      setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
      setNotes("");
      setError(null);
      onClose();
    }
  };

  if (!debt) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Record a payment made to {debt.creditor} - {debt.debtName}
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
              <span className="text-sm text-blue-700">Minimum Payment:</span>
              <span className="text-sm font-semibold text-blue-700">
                {formatCurrency(debt.minimumPayment)}
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
                max={debt.currentBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-8"
                required
                disabled={submitting}
              />
            </div>
            <p className="text-xs text-gray-500">
              Enter the amount you paid to this creditor
            </p>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paymentDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Payment Date *
            </Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              required
              disabled={submitting}
            />
            <p className="text-xs text-gray-500">
              When was this payment made?
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
              <strong>Note:</strong> This will reduce your debt balance and update your payment history.
              The system will automatically calculate how much goes to fees, interest, and principal
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
              disabled={submitting || !amount || !paymentDate}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                'Record Payment'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

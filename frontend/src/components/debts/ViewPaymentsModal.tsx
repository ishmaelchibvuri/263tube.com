"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  DollarSign,
  TrendingDown,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api-client-debts";
import { Debt, PaymentRecord } from "@/types";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EditPaymentModal } from "./EditPaymentModal";

interface ViewPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
  onPaymentsChanged?: () => void;
}

export function ViewPaymentsModal({
  isOpen,
  onClose,
  debt,
  onPaymentsChanged,
}: ViewPaymentsModalProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (isOpen && debt) {
      loadPayments();
    }
  }, [isOpen, debt]);

  const loadPayments = async () => {
    if (!debt) return;

    setLoading(true);
    try {
      const paymentHistory = await api.payments.getPaymentHistory(debt.debtId);
      // Sort by date descending (newest first)
      const sorted = paymentHistory.sort((a, b) =>
        b.paymentDate.localeCompare(a.paymentDate)
      );
      setPayments(sorted);
    } catch (error) {
      console.error("Failed to load payments:", error);
      toast.error("Failed to load payment history", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditPayment = (payment: PaymentRecord) => {
    setEditingPayment(payment);
    setShowEditModal(true);
  };

  const handlePaymentUpdated = async () => {
    setShowEditModal(false);
    setEditingPayment(null);
    // Reload payments and notify parent
    await loadPayments();
    onPaymentsChanged?.();
  };

  const handleDeletePayment = async (payment: PaymentRecord) => {
    if (!debt) return;

    setDeletingId(payment.paymentId);
    try {
      await api.payments.deletePayment(
        payment.paymentId,
        debt.debtId,
        payment.paymentDate
      );

      toast.success("Payment deleted successfully", {
        description: "The debt balance has been adjusted",
      });

      // Reload payments and notify parent
      await loadPayments();
      onPaymentsChanged?.();
    } catch (error) {
      console.error("Failed to delete payment:", error);
      toast.error("Failed to delete payment", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getPaymentTypeBadge = (paymentType?: string) => {
    switch (paymentType) {
      case "auto":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            Auto
          </Badge>
        );
      case "extra":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            Extra
          </Badge>
        );
      case "minimum":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
            Minimum
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
            Manual
          </Badge>
        );
    }
  };

  const getPaymentSourceLabel = (source?: string) => {
    switch (source) {
      case "auto_minimum":
        return "Auto-allocated";
      case "strategy_allocation":
        return "Strategy Page";
      case "manual_entry":
        return "Manual Entry";
      default:
        return "Unknown";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Payment History
          </DialogTitle>
          <DialogDescription>
            {debt?.debtName} - All recorded payments
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <DollarSign className="h-12 w-12 mb-3 text-gray-300" />
            <p className="font-semibold">No payments recorded yet</p>
            <p className="text-sm">Payment history will appear here once you start making payments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Payments</p>
                <p className="text-lg font-bold text-gray-900">{payments.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Amount Paid</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Current Balance</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(debt?.currentBalance || 0)}
                </p>
              </div>
            </div>

            {/* Payments Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Applied To</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.paymentId}>
                      <TableCell className="font-medium">
                        {format(parseISO(payment.paymentDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-green-600 font-semibold">
                          <TrendingDown className="h-3 w-3" />
                          {formatCurrency(payment.amount)}
                        </div>
                      </TableCell>
                      <TableCell>{getPaymentTypeBadge(undefined)}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-sm text-gray-600 cursor-help">
                                <div className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  View Breakdown
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between gap-4">
                                  <span>Principal:</span>
                                  <span className="font-semibold">
                                    {formatCurrency(payment.amountToPrincipal)}
                                  </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span>Interest:</span>
                                  <span className="font-semibold">
                                    {formatCurrency(payment.amountToInterest)}
                                  </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span>Fees:</span>
                                  <span className="font-semibold">
                                    {formatCurrency(payment.amountToFees)}
                                  </span>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {getPaymentSourceLabel(undefined)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {false ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className="text-xs cursor-help bg-gray-50"
                                  >
                                    Auto-Generated
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">
                                    This payment was automatically created and cannot be edited
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                                onClick={() => handleEditPayment(payment)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                onClick={() => handleDeletePayment(payment)}
                                disabled={deletingId === payment.paymentId}
                              >
                                {deletingId === payment.paymentId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Auto-generated payments cannot be edited or deleted. Manual payments can be
                  edited or removed, which will adjust the debt balance accordingly.
                </span>
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Edit Payment Modal */}
      <EditPaymentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingPayment(null);
        }}
        debt={debt}
        payment={editingPayment}
        onPaymentUpdated={handlePaymentUpdated}
      />
    </Dialog>
  );
}

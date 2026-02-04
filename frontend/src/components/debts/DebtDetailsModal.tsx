"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Debt } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  AlertTriangle,
  CheckCheck,
  CheckCircle,
  DollarSign,
  Calendar,
  Percent,
  CreditCard,
  TrendingUp,
  Shield,
} from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

interface DebtDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
}

export function DebtDetailsModal({ isOpen, onClose, debt }: DebtDetailsModalProps) {
  if (!debt) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getOrdinalSuffix = (day: number) => {
    if (day === 1 || day === 21 || day === 31) return 'st';
    if (day === 2 || day === 22) return 'nd';
    if (day === 3 || day === 23) return 'rd';
    return 'th';
  };

  // Calculate status
  const getDebtStatus = () => {
    if (debt.section129Received && debt.section129Deadline) {
      const deadline = parseISO(debt.section129Deadline);
      const today = new Date();
      if (deadline > today) {
        return 'section_129_active';
      }
    }

    const inDuplumRatio = debt.accumulatedInterestAndFees / debt.originalPrincipal;
    if (inDuplumRatio >= 0.85) {
      return 'in_duplum_zone';
    }

    if (debt.currentBalance <= 0 || debt.paidOffAt) {
      return 'paid_off';
    }

    return 'on_track';
  };

  const status = getDebtStatus();
  const inDuplumRatio = debt.accumulatedInterestAndFees / debt.originalPrincipal;
  const hasFees = debt.monthlyServiceFee > 0 || debt.creditLifePremium > 0;

  const getStatusBadge = () => {
    switch (status) {
      case 'section_129_active':
        const daysRemaining = debt.section129Deadline
          ? differenceInDays(parseISO(debt.section129Deadline), new Date())
          : 0;
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Section 129 ({daysRemaining}d remaining)
          </Badge>
        );
      case 'in_duplum_zone':
        const percentage = ((debt.accumulatedInterestAndFees / debt.originalPrincipal) * 100).toFixed(0);
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            In Duplum Zone ({percentage}%)
          </Badge>
        );
      case 'paid_off':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 flex items-center gap-1">
            <CheckCheck className="h-3 w-3" />
            Paid Off
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            On Track
          </Badge>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold mb-2">
                {debt.debtName}
              </DialogTitle>
              <p className="text-sm text-gray-600">{debt.creditor}</p>
            </div>
            {getStatusBadge()}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Balance */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-medium text-gray-600">Current Balance</p>
            </div>
            <p className="text-4xl font-bold text-gray-900">{formatCurrency(debt.currentBalance)}</p>
            {debt.originalPrincipal > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Original: {formatCurrency(debt.originalPrincipal)}
              </p>
            )}
          </div>

          {/* Primary Details */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Percent className="h-4 w-4 text-gray-600" />
                <p className="text-xs font-semibold text-gray-500 uppercase">Interest Rate</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {debt.annualInterestRate.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">per annum</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-4 w-4 text-gray-600" />
                <p className="text-xs font-semibold text-gray-500 uppercase">Minimum Payment</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(debt.minimumPayment || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">per month</p>
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Account Information
            </h3>
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
              {debt.accountNumber && (
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm text-gray-600">Account Number</span>
                  <span className="text-sm font-semibold text-gray-900">{debt.accountNumber}</span>
                </div>
              )}
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Payment Due Day
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {debt.paymentDueDay}{getOrdinalSuffix(debt.paymentDueDay)} of each month
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Fees */}
          {hasFees && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Monthly Fees
              </h3>
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                {debt.monthlyServiceFee > 0 && (
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-gray-600">Service Fee</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(debt.monthlyServiceFee)}
                    </span>
                  </div>
                )}
                {debt.creditLifePremium > 0 && (
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Credit Life Premium
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(debt.creditLifePremium)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
                  <span className="text-sm font-semibold text-gray-700">Total Monthly Fees</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(debt.monthlyServiceFee + debt.creditLifePremium)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* In Duplum Status */}
          {inDuplumRatio > 0.5 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                In Duplum Status
              </h3>
              <div className={`rounded-lg p-4 border-2 ${
                inDuplumRatio >= 0.85 ? 'bg-red-50 border-red-200' :
                inDuplumRatio >= 0.7 ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Interest Cap Usage</span>
                  <span className={`text-2xl font-bold ${
                    inDuplumRatio >= 0.85 ? 'text-red-600' :
                    inDuplumRatio >= 0.7 ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {(inDuplumRatio * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-white rounded-full h-3 shadow-inner">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      inDuplumRatio >= 0.85 ? 'bg-red-500' :
                      inDuplumRatio >= 0.7 ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(inDuplumRatio * 100, 100)}%` }}
                  />
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Accumulated Interest & Fees</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(debt.accumulatedInterestAndFees)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Original Principal</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(debt.originalPrincipal)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-4 p-3 bg-white rounded border border-gray-200">
                  <strong>In Duplum Rule:</strong> South African law caps the total interest, fees, and insurance
                  at 100% of the original loan amount. Once this limit is reached, interest stops accumulating.
                </p>
              </div>
            </div>
          )}

          {/* Section 129 Warning */}
          {status === 'section_129_active' && debt.section129Deadline && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-900 mb-2">Section 129 Notice Active</h3>
                  <p className="text-sm text-red-800 mb-3">
                    You have {differenceInDays(parseISO(debt.section129Deadline), new Date())} business days remaining
                    to respond before the creditor can proceed with legal action.
                  </p>
                  <div className="bg-white rounded p-3 border border-red-200">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Notice Received</span>
                      <span className="font-semibold text-gray-900">
                        {debt.section129Date ? new Date(debt.section129Date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Response Deadline</span>
                      <span className="font-semibold text-red-700">
                        {new Date(debt.section129Deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-red-700 mt-3 font-medium">
                    This debt requires immediate attention. Consider contacting the creditor or seeking debt counselling.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

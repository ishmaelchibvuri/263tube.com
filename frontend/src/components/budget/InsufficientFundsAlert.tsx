"use client";

import { AlertTriangle, Calculator, TrendingUp, Phone } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface InsufficientFundsAlertProps {
  availableForDebts: number;
  minimumDebtPayments: number;
  shortfall: number;
  onAdjustBudget?: () => void;
}

export function InsufficientFundsAlert({
  availableForDebts,
  minimumDebtPayments,
  shortfall,
  onAdjustBudget,
}: InsufficientFundsAlertProps) {
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Alert variant="destructive" className="bg-gradient-to-r from-red-50 to-orange-50 border-red-300 border-2 shadow-lg">
      <AlertTriangle className="h-5 w-5 text-red-600" />
      <AlertTitle className="text-lg font-bold text-red-900">
        Insufficient Funds for Debt Payments
      </AlertTitle>
      <AlertDescription className="mt-3 space-y-4">
        <div className="text-sm text-red-800">
          <p className="font-semibold mb-2">
            Your available budget for debts ({formatCurrency(availableForDebts)}) is not enough
            to cover your minimum monthly debt payments ({formatCurrency(minimumDebtPayments)}).
          </p>
          <p className="font-bold text-red-900">
            Shortfall: {formatCurrency(shortfall)}
          </p>
        </div>

        <div className="bg-white/80 rounded-lg p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-900">What you can do:</p>

          <div className="grid gap-2">
            {onAdjustBudget && (
              <Button
                onClick={onAdjustBudget}
                variant="outline"
                className="justify-start gap-2 h-auto py-3 text-left hover:bg-blue-50 hover:border-blue-300"
                size="sm"
              >
                <Calculator className="h-4 w-4 flex-shrink-0 text-blue-600" />
                <div>
                  <div className="font-semibold text-sm">Adjust Your Budget</div>
                  <div className="text-xs text-gray-600">Review and reduce expenses to free up more funds</div>
                </div>
              </Button>
            )}

            <Button
              onClick={() => router.push('/strategy')}
              variant="outline"
              className="justify-start gap-2 h-auto py-3 text-left hover:bg-purple-50 hover:border-purple-300"
              size="sm"
            >
              <TrendingUp className="h-4 w-4 flex-shrink-0 text-purple-600" />
              <div>
                <div className="font-semibold text-sm">Review Debt Strategy</div>
                <div className="text-xs text-gray-600">Explore restructuring or repayment options</div>
              </div>
            </Button>

            <Button
              onClick={() => window.open('https://www.ncr.org.za/debt-counselling', '_blank')}
              variant="outline"
              className="justify-start gap-2 h-auto py-3 text-left hover:bg-green-50 hover:border-green-300"
              size="sm"
            >
              <Phone className="h-4 w-4 flex-shrink-0 text-green-600" />
              <div>
                <div className="font-semibold text-sm">Contact Debt Counselor</div>
                <div className="text-xs text-gray-600">Get professional help from a registered debt counselor</div>
              </div>
            </Button>
          </div>
        </div>

        <div className="text-xs text-red-700 bg-red-100 rounded p-2">
          <strong>Important:</strong> Not meeting minimum debt payments can result in legal action,
          damage to your credit score, and additional fees. Please take action immediately.
        </div>
      </AlertDescription>
    </Alert>
  );
}

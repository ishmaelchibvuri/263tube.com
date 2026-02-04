"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Debt, SA_MAJOR_CREDITORS, CURRENT_NCA_CAPS } from "@/types";
import { api } from "@/lib/api-client-debts";
import { calculateSection129Deadline, validateInterestRate } from "@/lib/debt-calculations";
import { format } from "date-fns";
import { AlertCircle, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface DebtFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  debt?: Debt | null; // If provided, we're editing; otherwise adding
}

type Step = 1 | 2 | 3 | 4;

export function DebtFormModal({ isOpen, onClose, onSuccess, debt }: DebtFormModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<Partial<Debt>>({
    creditor: '',
    debtName: '',
    accountNumber: '',
    originalPrincipal: 0,
    openingBalance: 0,
    currentBalance: 0,
    annualInterestRate: 0,
    monthlyServiceFee: 0,
    creditLifePremium: 0,
    initiationFeeBalance: 0,
    minimumPayment: 0,
    paymentDueDay: 1,
    section129Received: false,
    section129Date: null,
    section129Deadline: null,
    accumulatedInterestAndFees: 0,
    agreementDate: format(new Date(), 'yyyy-MM-dd'),
    debtType: 'unsecured',
  });
  const [saving, setSaving] = useState(false);
  const [rateWarning, setRateWarning] = useState<string | null>(null);

  useEffect(() => {
    if (debt) {
      // Editing existing debt
      setFormData(debt);
    } else {
      // Reset form for new debt
      setFormData({
        creditor: '',
        debtName: '',
        accountNumber: '',
        originalPrincipal: 0,
        openingBalance: 0,
        currentBalance: 0,
        annualInterestRate: 0,
        monthlyServiceFee: 0,
        creditLifePremium: 0,
        initiationFeeBalance: 0,
        minimumPayment: 0,
        paymentDueDay: 1,
        section129Received: false,
        section129Date: null,
        section129Deadline: null,
        accumulatedInterestAndFees: 0,
        agreementDate: format(new Date(), 'yyyy-MM-dd'),
        debtType: 'unsecured',
      });
      setCurrentStep(1);
    }
  }, [debt, isOpen]);

  const updateFormData = (field: keyof Debt, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-calculate Section 129 deadline
    if (field === 'section129Date' && value) {
      const deadline = calculateSection129Deadline(value);
      setFormData(prev => ({ ...prev, section129Deadline: deadline }));
    }

    // Validate interest rate
    if (field === 'annualInterestRate' || field === 'debtType') {
      const rate = field === 'annualInterestRate' ? value : formData.annualInterestRate || 0;
      const type = field === 'debtType' ? value : formData.debtType;
      const validation = validateInterestRate(rate, type);
      setRateWarning(validation.warning || null);
    }

    // Auto-populate suggested fees for known creditors
    if (field === 'creditor') {
      const creditor = SA_MAJOR_CREDITORS.find(c => c.id === value);
      if (creditor?.commonFees) {
        setFormData(prev => ({
          ...prev,
          monthlyServiceFee: creditor.commonFees?.monthlyServiceFee || prev.monthlyServiceFee,
          annualInterestRate: creditor.commonFees?.typicalInterestRate || prev.annualInterestRate,
        }));
      }
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (debt) {
        // Update existing debt
        await api.debts.updateDebt(debt.debtId, formData);
      } else {
        // Create new debt
        await api.debts.createDebt(formData as any);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving debt:', error);
      alert('Failed to save debt. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.creditor && formData.debtName;
      case 2:
        return formData.originalPrincipal && formData.currentBalance && formData.annualInterestRate && formData.minimumPayment;
      case 3:
        return true; // Fees are optional
      case 4:
        return true; // Section 129 is optional
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{debt ? 'Edit Debt' : 'Add New Debt'}</DialogTitle>
          <DialogDescription>
            Step {currentStep} of 4 - {
              currentStep === 1 ? 'Basic Information' :
              currentStep === 2 ? 'The Numbers' :
              currentStep === 3 ? 'Hidden Costs (SA-Specific)' :
              'Legal Status'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map(step => (
              <div
                key={step}
                className={`h-2 flex-1 rounded ${
                  step <= currentStep ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="creditor">Creditor *</Label>
                <Select
                  value={formData.creditor}
                  onValueChange={(value) => updateFormData('creditor', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select creditor" />
                  </SelectTrigger>
                  <SelectContent>
                    {SA_MAJOR_CREDITORS.map(creditor => (
                      <SelectItem key={creditor.id} value={creditor.name}>
                        {creditor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="debtName">Debt Nickname *</Label>
                <Input
                  id="debtName"
                  value={formData.debtName}
                  onChange={(e) => updateFormData('debtName', e.target.value)}
                  placeholder="e.g., 'Capitec Credit Card'"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Give this debt a memorable name
                </p>
              </div>

              <div>
                <Label htmlFor="accountNumber">Account Number (Optional)</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => updateFormData('accountNumber', e.target.value)}
                  placeholder="For your reference"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="debtType">Debt Type</Label>
                <Select
                  value={formData.debtType}
                  onValueChange={(value) => updateFormData('debtType', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mortgage">Mortgage/Home Loan</SelectItem>
                    <SelectItem value="vehicle">Vehicle Finance</SelectItem>
                    <SelectItem value="unsecured">Unsecured/Personal Loan</SelectItem>
                    <SelectItem value="creditCard">Credit Card</SelectItem>
                    <SelectItem value="storeCard">Store Card</SelectItem>
                    <SelectItem value="shortTerm">Short-term Loan</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: The Numbers */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="originalPrincipal">Original Principal *</Label>
                <Input
                  id="originalPrincipal"
                  type="number"
                  step="0.01"
                  value={formData.originalPrincipal || ''}
                  onChange={(e) => updateFormData('originalPrincipal', parseFloat(e.target.value) || 0)}
                  placeholder="R 0.00"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The amount you first borrowed, before any interest
                </p>
              </div>

              <div>
                <Label htmlFor="openingBalance">Opening Balance</Label>
                <Input
                  id="openingBalance"
                  type="number"
                  step="0.01"
                  value={formData.openingBalance || ''}
                  onChange={(e) => updateFormData('openingBalance', parseFloat(e.target.value) || 0)}
                  placeholder="R 0.00"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Balance when the agreement started
                </p>
              </div>

              <div>
                <Label htmlFor="currentBalance">Current Balance *</Label>
                <Input
                  id="currentBalance"
                  type="number"
                  step="0.01"
                  value={formData.currentBalance || ''}
                  onChange={(e) => updateFormData('currentBalance', parseFloat(e.target.value) || 0)}
                  placeholder="R 0.00"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="annualInterestRate">Interest Rate (% per year) *</Label>
                <Input
                  id="annualInterestRate"
                  type="number"
                  step="0.01"
                  value={formData.annualInterestRate || ''}
                  onChange={(e) => updateFormData('annualInterestRate', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="mt-1"
                />
                {rateWarning && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{rateWarning}</p>
                  </div>
                )}
                {formData.debtType && !rateWarning && (
                  <p className="text-xs text-gray-500 mt-1">
                    NCA max for {formData.debtType}: {
                      formData.debtType === 'mortgage' ? CURRENT_NCA_CAPS.mortgage :
                      formData.debtType === 'vehicle' ? CURRENT_NCA_CAPS.vehicle :
                      formData.debtType === 'shortTerm' ? CURRENT_NCA_CAPS.shortTerm :
                      CURRENT_NCA_CAPS.unsecured
                    }%
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="minimumPayment">Minimum Monthly Payment *</Label>
                <Input
                  id="minimumPayment"
                  type="number"
                  step="0.01"
                  value={formData.minimumPayment || ''}
                  onChange={(e) => updateFormData('minimumPayment', parseFloat(e.target.value) || 0)}
                  placeholder="R 0.00"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="paymentDueDay">Payment Due Day (1-31) *</Label>
                <Input
                  id="paymentDueDay"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.paymentDueDay || ''}
                  onChange={(e) => updateFormData('paymentDueDay', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="agreementDate">Agreement Date</Label>
                <Input
                  id="agreementDate"
                  type="date"
                  value={formData.agreementDate}
                  onChange={(e) => updateFormData('agreementDate', e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  When the credit agreement was signed
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Hidden Costs */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Let's find the fees they don't advertise</h4>
                <p className="text-sm text-blue-700">
                  These monthly charges add up quickly. Check your latest statement.
                </p>
              </div>

              <div>
                <Label htmlFor="monthlyServiceFee">Monthly Service Fee</Label>
                <Input
                  id="monthlyServiceFee"
                  type="number"
                  step="0.01"
                  value={formData.monthlyServiceFee || ''}
                  onChange={(e) => updateFormData('monthlyServiceFee', parseFloat(e.target.value) || 0)}
                  placeholder="R 0.00"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Most store cards charge R50-R69 per month
                </p>
              </div>

              <div>
                <Label htmlFor="creditLifePremium">Credit Life Insurance Premium</Label>
                <Input
                  id="creditLifePremium"
                  type="number"
                  step="0.01"
                  value={formData.creditLifePremium || ''}
                  onChange={(e) => updateFormData('creditLifePremium', parseFloat(e.target.value) || 0)}
                  placeholder="R 0.00"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Check your statement for 'Credit Life' or 'Insurance'
                </p>
              </div>

              <div>
                <Label htmlFor="initiationFeeBalance">Initiation Fee Balance</Label>
                <Input
                  id="initiationFeeBalance"
                  type="number"
                  step="0.01"
                  value={formData.initiationFeeBalance || ''}
                  onChange={(e) => updateFormData('initiationFeeBalance', parseFloat(e.target.value) || 0)}
                  placeholder="R 0.00"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usually only on personal loans, often capitalized into the balance
                </p>
              </div>

              <div>
                <Label htmlFor="accumulatedInterestAndFees">Accumulated Interest & Fees (Total Since Start)</Label>
                <Input
                  id="accumulatedInterestAndFees"
                  type="number"
                  step="0.01"
                  value={formData.accumulatedInterestAndFees || ''}
                  onChange={(e) => updateFormData('accumulatedInterestAndFees', parseFloat(e.target.value) || 0)}
                  placeholder="R 0.00"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Total interest and fees charged since the loan started (for In Duplum tracking)
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Legal Status */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2">Section 129 Notice</h4>
                <p className="text-sm text-yellow-700 leading-relaxed">
                  A Section 129 letter is a formal legal notice. If you've received one, you have 10 business
                  days to respond or the creditor can take legal action. This debt must be prioritized.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-white border rounded">
                <div>
                  <Label htmlFor="section129Received" className="font-semibold">
                    Have you received a Section 129 Letter of Demand?
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    This is a serious legal notice that requires immediate attention
                  </p>
                </div>
                <Switch
                  id="section129Received"
                  checked={formData.section129Received}
                  onCheckedChange={(checked) => updateFormData('section129Received', checked)}
                />
              </div>

              {formData.section129Received && (
                <div className="space-y-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                  <div>
                    <Label htmlFor="section129Date">Date of Section 129 Letter *</Label>
                    <Input
                      id="section129Date"
                      type="date"
                      value={formData.section129Date || ''}
                      onChange={(e) => updateFormData('section129Date', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {formData.section129Deadline && (
                    <div className="p-3 bg-red-100 border border-red-300 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <p className="font-semibold text-red-900">Response Deadline</p>
                      </div>
                      <p className="text-red-800">
                        {format(new Date(formData.section129Deadline), 'dd MMMM yyyy')}
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        (10 business days from letter date, excluding SA public holidays)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!formData.section129Received && (
                <div className="p-4 bg-green-50 border border-green-200 rounded flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-green-900 font-semibold">No urgent legal action</p>
                    <p className="text-xs text-green-700">
                      You can proceed with your normal repayment strategy
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={handleBack} className="flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={saving || !isStepValid()}
                >
                  {saving ? 'Saving...' : debt ? 'Update Debt' : 'Add Debt'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

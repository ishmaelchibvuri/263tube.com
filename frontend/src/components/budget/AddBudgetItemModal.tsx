"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BudgetLineItem } from "@/types";

interface AddBudgetItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<BudgetLineItem, 'id'>) => void;
  editingItem?: BudgetLineItem | null;
  itemType?: 'income' | 'obligation';
  preSelectedCategory?: string;
}

const INCOME_CATEGORIES = [
  { value: 'netSalary', label: 'Net Salary' },
  { value: 'secondaryIncome', label: 'Secondary Income' },
  { value: 'partnerContribution', label: 'Partner Contribution' },
  { value: 'grants', label: 'Grants (SASSA, etc.)' },
];

const OBLIGATION_CATEGORIES = [
  { value: 'housing', label: 'Housing' },
  { value: 'transport', label: 'Transport' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'education', label: 'Education' },
  { value: 'familySupport', label: 'Family Support' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'personalCare', label: 'Personal Care' },
  { value: 'health', label: 'Health' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'other', label: 'Other' },
];

export default function AddBudgetItemModal({
  isOpen,
  onClose,
  onSave,
  editingItem,
  itemType = 'obligation',
  preSelectedCategory = '',
}: AddBudgetItemModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setCategory(editingItem.category);
      setAmount(editingItem.amount.toString());
    } else if (preSelectedCategory) {
      setName('');
      setCategory(preSelectedCategory);
      setAmount('');
    } else {
      setName('');
      setCategory('');
      setAmount('');
    }
  }, [editingItem, preSelectedCategory, isOpen]);

  const categories = itemType === 'income' ? INCOME_CATEGORIES : OBLIGATION_CATEGORIES;

  const handleSave = () => {
    if (!name || !category || !amount) {
      alert('Please fill in all fields');
      return;
    }

    onSave({
      type: itemType,
      name,
      category: category as BudgetLineItem['category'],
      amount: parseFloat(amount),
    });

    setName('');
    setCategory('');
    setAmount('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setCategory('');
    setAmount('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Edit' : 'Add'} {itemType === 'income' ? 'Income' : 'Obligation/Expense'} Item
          </DialogTitle>
          <DialogDescription>
            Add a custom {itemType === 'income' ? 'income source' : 'expense'} to your budget. Choose a category where this {itemType === 'income' ? 'income' : 'expense'} belongs.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={itemType === 'income' ? 'e.g., Freelance work, Rental income' : 'e.g., Gym membership, Netflix'}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} disabled={!!preSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {preSelectedCategory && (
              <p className="text-xs text-gray-500">Category is pre-selected for this section</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">Monthly Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="R 0.00"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {editingItem ? 'Update' : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

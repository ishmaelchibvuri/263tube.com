"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { BudgetLineItem } from "@/types";

interface EditBudgetItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: BudgetLineItem) => void;
  item: BudgetLineItem | null;
}

export default function EditBudgetItemModal({
  isOpen,
  onClose,
  onSave,
  item,
}: EditBudgetItemModalProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (item) {
      setName(item.name);
      setAmount(item.amount.toString());
    }
  }, [item]);

  const handleSave = () => {
    if (!item || !name.trim() || !amount) return;

    const updatedItem: BudgetLineItem = {
      ...item,
      name: name.trim(),
      amount: parseFloat(amount),
    };

    onSave(updatedItem);
    handleClose();
  };

  const handleClose = () => {
    setName("");
    setAmount("");
    onClose();
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Budget Item</DialogTitle>
          <DialogDescription>
            Update the details for this budget item
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Item Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Rent, Groceries"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-amount">Amount (R)</Label>
            <Input
              id="edit-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !amount || parseFloat(amount) <= 0}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

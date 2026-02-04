"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Info, Edit, Trash2 } from "lucide-react";
import { BudgetLineItem } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LucideIcon } from "lucide-react";
import { useState } from "react";

interface CategoryCardProps {
  categoryId: string;
  label: string;
  icon: LucideIcon;
  items: BudgetLineItem[];
  total: number;
  color: "green" | "blue" | "purple";
  onAddItem: () => void;
  onEditItem: (item: BudgetLineItem) => void;
  onDeleteItem: (itemId: string) => void;
  isReadOnly: boolean;
  formatCurrency: (amount: number) => string;
  description?: string;
}

export function CategoryCard({
  categoryId,
  label,
  icon: Icon,
  items,
  total,
  color,
  onAddItem,
  onEditItem,
  onDeleteItem,
  isReadOnly,
  formatCurrency,
  description,
}: CategoryCardProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const colorClasses = {
    green: {
      icon: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
      hover: "hover:border-green-300",
      text: "text-green-700",
      itemBg: "bg-green-50/50",
      button: "text-green-600 hover:bg-green-100",
    },
    blue: {
      icon: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      hover: "hover:border-blue-300",
      text: "text-blue-700",
      itemBg: "bg-blue-50/50",
      button: "text-blue-600 hover:bg-blue-100",
    },
    purple: {
      icon: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
      hover: "hover:border-purple-300",
      text: "text-purple-700",
      itemBg: "bg-purple-50/50",
      button: "text-purple-600 hover:bg-purple-100",
    },
  };

  const colors = colorClasses[color];

  return (
    <Card className={`${colors.border} ${colors.hover} transition-all cursor-help`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          {/* Left: Icon and Label */}
          <div className="flex items-center gap-3 flex-1">
            <div className={`${colors.bg} rounded-full p-2`}>
              <Icon className={`h-5 w-5 ${colors.icon}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">{label}</p>
              <p className={`text-xl font-bold ${colors.text}`}>
                {formatCurrency(total)}
              </p>
            </div>
          </div>

          {/* Right: Info Icon (tooltip) and Add Button */}
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setTooltipOpen(!tooltipOpen)}
                  >
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="left"
                  align="start"
                  className="max-w-md p-3"
                  onPointerDownOutside={(e) => {
                    // Prevent tooltip from closing when clicking inside
                    const target = e.target as HTMLElement;
                    if (target.closest('[data-tooltip-content]')) {
                      e.preventDefault();
                    }
                  }}
                >
                  <div data-tooltip-content>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm">{label}</p>
                      {!isReadOnly && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-6 px-2 ${colors.button}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddItem();
                            setTooltipOpen(false);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>

                    {description && (
                      <p className="text-xs text-gray-600 mb-3 pb-2 border-b border-gray-200">
                        {description}
                      </p>
                    )}

                    {items.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No items added</p>
                    ) : (
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between p-2 rounded ${colors.itemBg} group`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.name}
                              </p>
                              <p className={`text-xs font-semibold ${colors.text}`}>
                                {formatCurrency(item.amount)}
                              </p>
                            </div>
                            {!isReadOnly && (
                              <div className="flex items-center gap-1 ml-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 opacity-70 group-hover:opacity-100 hover:bg-blue-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditItem(item);
                                    setTooltipOpen(false);
                                  }}
                                >
                                  <Edit className="h-3 w-3 text-blue-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 opacity-70 group-hover:opacity-100 hover:bg-red-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteItem(item.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 text-red-600" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                        {items.length > 1 && (
                          <div className="pt-2 mt-2 border-t border-gray-200">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-gray-700">Total ({items.length} items)</span>
                              <span className={`font-bold ${colors.text}`}>
                                {formatCurrency(total)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {!isReadOnly && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onAddItem}
                className={`h-8 w-8 p-0 ${colors.button}`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

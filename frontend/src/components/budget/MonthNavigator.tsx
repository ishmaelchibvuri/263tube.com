"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, parseISO, addMonths, subMonths, isFuture, startOfMonth } from "date-fns";

interface MonthNavigatorProps {
  currentMonth: string; // Format: "YYYY-MM"
  onMonthChange: (month: string) => void;
}

export default function MonthNavigator({ currentMonth, onMonthChange }: MonthNavigatorProps) {
  const currentDate = parseISO(`${currentMonth}-01`);
  const today = new Date();
  const isCurrentMonthView = format(startOfMonth(today), 'yyyy-MM') === currentMonth;
  const isFutureMonthView = isFuture(currentDate);

  const handlePreviousMonth = () => {
    const prevMonth = subMonths(currentDate, 1);
    onMonthChange(format(prevMonth, 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(currentDate, 1);
    onMonthChange(format(nextMonth, 'yyyy-MM'));
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePreviousMonth}
        className="h-9 w-9"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="px-4 py-2 bg-white rounded-full shadow-sm border min-w-[180px] text-center">
        <span className="font-semibold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </span>
        {!isCurrentMonthView && (
          <span className="text-xs text-gray-500 block">
            {isFutureMonthView ? 'Future' : 'Past'}
          </span>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNextMonth}
        className="h-9 w-9"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}

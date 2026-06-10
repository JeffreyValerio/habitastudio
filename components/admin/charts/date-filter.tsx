"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export type DateRange = {
  startDate: Date;
  endDate: Date;
};

interface DateFilterProps {
  onDateRangeChange: (range: DateRange) => void;
}

export function DateFilter({ onDateRangeChange }: DateFilterProps) {
  const [activeFilter, setActiveFilter] = useState<string>("1m");

  const getDateRange = (filter: string): DateRange => {
    const endDate = new Date();
    const startDate = new Date();

    switch (filter) {
      case "1m":
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case "3m":
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case "6m":
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case "all":
        startDate.setFullYear(2000);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 1);
    }

    return { startDate, endDate };
  };

  const handleFilter = (filter: string) => {
    setActiveFilter(filter);
    onDateRangeChange(getDateRange(filter));
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Calendar className="h-4 w-4 text-gray-500" />
      <div className="flex gap-1 flex-wrap">
        <Button
          variant={activeFilter === "1m" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilter("1m")}
          className="text-xs"
        >
          Último mes
        </Button>
        <Button
          variant={activeFilter === "3m" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilter("3m")}
          className="text-xs"
        >
          3 meses
        </Button>
        <Button
          variant={activeFilter === "6m" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilter("6m")}
          className="text-xs"
        >
          6 meses
        </Button>
        <Button
          variant={activeFilter === "1y" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilter("1y")}
          className="text-xs"
        >
          Este año
        </Button>
        <Button
          variant={activeFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilter("all")}
          className="text-xs"
        >
          Todo
        </Button>
      </div>
    </div>
  );
}

import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const pages = React.useMemo(() => {
    const result: (number | string)[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        result.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          result.push(i);
        }
        result.push("ellipsis");
        result.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        result.push(1);
        result.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          result.push(i);
        }
      } else {
        result.push(1);
        result.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          result.push(i);
        }
        result.push("ellipsis");
        result.push(totalPages);
      }
    }
    
    return result;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {pages.map((page, index) => {
        if (page === "ellipsis") {
          return (
            <Button key={`ellipsis-${index}`} variant="ghost" size="sm" disabled>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          );
        }
        
        return (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page as number)}
          >
            {page}
          </Button>
        );
      })}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}


"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { getRecentCustomers } from "@/app/actions/crm";

interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
}

interface QuoteClientSelectorProps {
  onSelectCustomer: (customer: Partial<Customer>) => void;
  selectedCustomer?: Partial<Customer> | null;
  recentCustomersData?: Customer[];
}

export function QuoteClientSelector({
  onSelectCustomer,
  selectedCustomer,
  recentCustomersData = [],
}: QuoteClientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(
    recentCustomersData
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(recentCustomersData);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = recentCustomersData.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.company?.toLowerCase().includes(term)
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, recentCustomersData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
    });
    setShowSuggestions(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    onSelectCustomer({});
    setSearchTerm("");
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente o empresa..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="pl-9"
          />
        </div>
        {selectedCustomer?.name && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showSuggestions && filteredCustomers.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 border rounded-md bg-background shadow-md max-h-60 overflow-y-auto">
          <div className="p-2 space-y-1">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => handleSelectCustomer(customer)}
                className="w-full text-left p-2 rounded hover:bg-accent transition-colors text-sm"
              >
                <div className="font-medium">{customer.name}</div>
                {customer.email && (
                  <div className="text-xs text-muted-foreground">
                    {customer.email}
                  </div>
                )}
                {customer.company && (
                  <div className="text-xs text-muted-foreground">
                    {customer.company}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedCustomer?.name && (
        <div className="mt-2 p-3 rounded-md bg-accent/50 border">
          <p className="text-sm font-medium">{selectedCustomer.name}</p>
          {selectedCustomer.email && (
            <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
          )}
          {selectedCustomer.phone && (
            <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { searchCabys } from "@/app/actions/electronic-documents";

export function CabysField({
  value,
  onChange,
  placeholder = "Código CABYS (13 dígitos)",
}: {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ codigo: string; descripcion: string }[]>([]);
  const [searching, setSearching] = useState(false);

  const search = async () => {
    if (query.trim().length < 3) return;
    setSearching(true);
    try {
      const result = await searchCabys(query);
      setResults(result.ok ? result.results : []);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={13}
          className="font-mono text-sm"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
          placeholder="Buscar por descripción..."
          className="text-sm"
        />
        <Button type="button" variant="outline" size="icon" onClick={search} disabled={searching}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>
      {results.length > 0 && (
        <div className="max-h-32 overflow-y-auto rounded-md border text-sm">
          {results.map((r) => (
            <button
              type="button"
              key={r.codigo}
              onClick={() => {
                onChange(r.codigo);
                setResults([]);
                setQuery("");
              }}
              className="block w-full px-2 py-1.5 text-left hover:bg-accent"
            >
              <span className="font-mono text-xs text-muted-foreground">{r.codigo}</span> {r.descripcion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SubjectOption {
  code: string;
  name: string;
  hint?: string;
}

/** Searchable subject picker (by name or code). */
export function SubjectCombobox({
  options,
  value,
  onChange,
  placeholder,
  emptyLabel,
  extra,
  className,
}: {
  options: SubjectOption[];
  value: string | null;
  onChange: (code: string | null) => void;
  placeholder: string;
  emptyLabel?: string;
  /** An extra choice shown first, like "Não conta para o currículo". */
  extra?: { value: string; label: string };
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.code === value);
  const label = selected ? `${selected.code} · ${selected.name}` : value === extra?.value ? extra.label : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between font-normal", !value && "text-muted-foreground", className)}
        >
          <span className="truncate">{label}</span>
          <ChevronsUpDown className="size-4 opacity-60" strokeWidth={1.5} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(420px,calc(100vw-2rem))] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar por nome ou código" />
          <CommandList>
            <CommandEmpty>{emptyLabel ?? "Nenhuma disciplina encontrada"}</CommandEmpty>
            {extra && (
              <CommandGroup>
                <CommandItem
                  value={extra.label}
                  onSelect={() => {
                    onChange(extra.value);
                    setOpen(false);
                  }}
                >
                  {extra.label}
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.code}
                  value={`${o.code} ${o.name}`}
                  onSelect={() => {
                    onChange(o.code);
                    setOpen(false);
                  }}
                >
                  <span className="w-14 shrink-0 font-mono text-xs text-muted-foreground">{o.code}</span>
                  <span className="min-w-0 flex-1 truncate">{o.name}</span>
                  {o.hint && <span className="text-xs text-muted-foreground">{o.hint}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

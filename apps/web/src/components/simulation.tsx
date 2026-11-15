"use client";

import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PASSED } from "@/lib/transcript/parse";
import type { Program } from "@/lib/use-program";

const TODAY = "hoje";

/** Choose a past semester to replay from the imported transcript. */
export function SimulationSelect({ program }: { program: Program }) {
  const history = program.state.history;
  if (!history) return null;
  return (
    <Select
      value={program.state.simulateAt ?? TODAY}
      onValueChange={(value) => program.change(() => ({ simulateAt: value === TODAY ? null : value }))}
    >
      <SelectTrigger className="h-9 min-w-48" aria-label="Momento do curso">
        <History className="size-4 text-muted-foreground" strokeWidth={1.5} />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value={TODAY}>Hoje</SelectItem>
        {history.terms.map((term) => (
          <SelectItem key={term} value={term}>
            Início de {term}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Shown while replaying a past semester: what the student had passed then and
 * what they actually took that semester.
 */
export function SimulationBanner({
  program,
  term,
  onLoadTerm,
}: {
  program: Program;
  term: string;
  onLoadTerm?: (codes: string[]) => void;
}) {
  const history = program.state.history;
  const simulateAt = program.state.simulateAt;
  if (!history || !simulateAt) return null;

  const taken = history.rows.filter((r) => r.term === simulateAt);
  const passed = taken.filter((r) => PASSED.has(r.status)).length;
  const mapped = [...new Set(taken.map((r) => history.mapping[r.code]).filter(Boolean))];

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl border border-primary/25 bg-brand-tint px-4 py-3"
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium">
          Simulando o início de {simulateAt}: {program.completed.size} disciplinas aprovadas até ali
        </span>
        <span className="text-sm text-ink-2">
          {taken.length
            ? `No histórico, você cursou ${taken.length} em ${simulateAt} (${passed} aprovadas). `
            : `Sem disciplinas cursadas em ${simulateAt} no histórico. `}
          As turmas mostradas são as de {term}.
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {onLoadTerm && mapped.length > 0 && (
          <Button variant="outline" onClick={() => onLoadTerm(mapped)}>
            Montar com o que cursei
          </Button>
        )}
        <Button variant="outline" onClick={() => program.change(() => ({ simulateAt: null }))}>
          Voltar para hoje
        </Button>
      </div>
    </div>
  );
}

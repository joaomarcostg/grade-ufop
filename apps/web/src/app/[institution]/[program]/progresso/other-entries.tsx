"use client";

import { Lock, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Code, WarnBadge } from "@/components/brand";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EntryCategory } from "@/lib/catalog-types";
import { type EntryState, missingLabel } from "@/lib/eligibility";
import { formatHours, type Program } from "@/lib/use-program";

const GROUPS: { category: EntryCategory; title: string }[] = [
  { category: "elective", title: "Eletivas" },
  { category: "optional", title: "Optativas" },
  { category: "activity", title: "Atividades" },
];

function fold(text: string) {
  return text.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
}

function rank(s: EntryState) {
  if (s.status === "done") return 0;
  if (s.status === "available" && s.offered) return 1;
  if (s.status === "available") return 2;
  return 3;
}

/** Electives, optional subjects and activities: long lists, so searchable rows. */
export function OtherEntries({ program, term, onOpen }: { program: Program; term: string; onOpen: (code: string) => void }) {
  const [query, setQuery] = useState("");
  const [onlyOffered, setOnlyOffered] = useState(false);

  const groups = useMemo(() => {
    const q = fold(query.trim());
    return GROUPS.map((g) => {
      const all = [...program.eligibility.states.values()].filter((s) => s.entry.category === g.category);
      const shown = all
        .filter((s) => !q || fold(`${s.entry.subjectCode} ${program.name(s.entry.subjectCode)}`).includes(q))
        .filter((s) => !onlyOffered || s.offered || s.status === "done")
        .sort(
          (a, b) =>
            rank(a) - rank(b) ||
            program.name(a.entry.subjectCode).localeCompare(program.name(b.entry.subjectCode), "pt-BR"),
        );
      const doneHours = all
        .filter((s) => s.status === "done")
        .reduce((sum, s) => sum + (s.entry.workloadHours ?? 0), 0);
      return { ...g, all, shown, doneHours };
    }).filter((g) => g.all.length > 0);
  }, [program, query, onlyOffered]);

  if (groups.length === 0) return null;

  return (
    <section aria-labelledby="others" className="flex flex-col gap-4">
      <h2 id="others" className="text-xl font-medium">
        Eletivas e atividades
      </h2>
      <Tabs defaultValue={groups[0].category} className="gap-0 rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
          <TabsList>
            {groups.map((g) => (
              <TabsTrigger key={g.category} value={g.category}>
                {g.title}
                <span className="font-mono text-xs text-muted-foreground">{g.all.length}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox id="only-offered" checked={onlyOffered} onCheckedChange={(c) => setOnlyOffered(c === true)} />
              <Label htmlFor="only-offered" className="text-sm font-normal">
                Só ofertadas em {term}
              </Label>
            </div>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar"
                aria-label="Buscar eletiva por nome ou código"
                className="h-9 w-56 pl-8"
              />
            </div>
          </div>
        </div>
        {groups.map((g) => (
          <TabsContent key={g.category} value={g.category}>
            <p className="border-b px-4 py-2 text-sm text-muted-foreground">
              {formatHours(g.doneHours)} cursadas nesta categoria
            </p>
            <ul className="max-h-[480px] divide-y overflow-y-auto">
              {g.shown.length === 0 && <li className="px-4 py-4 text-sm text-muted-foreground">Nada encontrado</li>}
              {g.shown.map((s) => (
                <Row key={s.entry.subjectCode} state={s} program={program} term={term} onOpen={onOpen} />
              ))}
            </ul>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}

function Row({
  state,
  program,
  term,
  onOpen,
}: {
  state: EntryState;
  program: Program;
  term: string;
  onOpen: (code: string) => void;
}) {
  const code = state.entry.subjectCode;
  const done = state.status === "done";
  return (
    <li className="flex items-center gap-3 px-4 py-2">
      <Checkbox
        checked={done}
        disabled={program.simulating}
        onCheckedChange={(checked) => program.setCompleted([code], checked === true)}
        aria-label={`Aprovado em ${code} ${program.name(code)}`}
        className="data-checked:border-done data-checked:bg-done"
      />
      <button type="button" onClick={() => onOpen(code)} className="flex min-h-9 min-w-0 flex-1 items-center gap-3 text-left">
        <Code className="w-14 shrink-0">{code}</Code>
        <span className="min-w-0 flex-1 text-sm">{program.name(code)}</span>
        <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
          {state.entry.workloadHours ? formatHours(state.entry.workloadHours) : ""}
        </span>
        <span className="flex w-24 shrink-0 justify-end text-right text-xs text-muted-foreground sm:w-36">
          {done ? (
            <span className="text-done">aprovada</span>
          ) : state.status === "locked" ? (
            <span className="inline-flex items-center gap-1">
              <Lock className="size-3" strokeWidth={2} aria-hidden="true" />
              {missingLabel(state)}
            </span>
          ) : !state.offered ? (
            <span>não ofertada em {term}</span>
          ) : state.openSections === 0 ? (
            <WarnBadge>sem vagas</WarnBadge>
          ) : (
            <span className="text-ink-2">pode cursar</span>
          )}
        </span>
      </button>
    </li>
  );
}

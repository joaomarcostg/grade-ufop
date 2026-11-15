"use client";

import { Bookmark } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProgramBundle } from "@/lib/catalog-types";
import type { PlanOption } from "@/lib/scheduler";
import type { Program } from "@/lib/use-program";

const LETTERS = ["A", "B", "C", "D", "E"];

export function SavedPlans({
  bundle,
  program,
  option,
  optionIndex,
}: {
  bundle: ProgramBundle;
  program: Program;
  option: PlanOption;
  optionIndex: number;
}) {
  const saved = program.state.saved.filter((p) => p.term === bundle.term.code);
  const [name, setName] = useState("");
  const fallback = `Opção ${LETTERS[optionIndex]} · ${bundle.term.code}`;

  const save = () => {
    const sections = Object.fromEntries(Object.entries(option.sections).map(([code, s]) => [code, s.code]));
    const title = name.trim() || fallback;
    program.change((s) => ({
      saved: [
        { id: crypto.randomUUID(), name: title, term: bundle.term.code, sections, createdAt: new Date().toISOString() },
        ...s.saved,
      ],
    }));
    setName("");
    toast.success(`Grade “${title}” salva neste navegador`);
  };

  return (
    <section aria-labelledby="saved" className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <h2 id="saved" className="sr-only">
        Grades salvas
      </h2>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={fallback}
          aria-label="Nome da grade"
          className="h-9 min-w-0 flex-[1_1_240px]"
        />
        <Button type="submit">
          <Bookmark strokeWidth={1.5} />
          Salvar grade
        </Button>
      </form>

      {saved.length > 0 && (
        <ul className="flex flex-col divide-y border-t">
          {saved.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <span className="flex flex-col">
                <span className="text-sm font-medium">{p.name}</span>
                <span className="text-xs text-muted-foreground">
                  {Object.keys(p.sections).length} disciplinas · salva em{" "}
                  {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </span>
              <span className="flex gap-1">
                <Button
                  variant="ghost"
                  onClick={() => program.change(() => ({ planned: Object.keys(p.sections), locked: { ...p.sections } }))}
                >
                  Abrir
                </Button>
                <Button
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => program.change((s) => ({ saved: s.saved.filter((x) => x.id !== p.id) }))}
                >
                  Excluir
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

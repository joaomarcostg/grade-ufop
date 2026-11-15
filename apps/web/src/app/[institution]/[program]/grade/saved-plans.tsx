"use client";

import { useState } from "react";

import { BookmarkIcon } from "@/components/icons";
import { buttonClass, Card } from "@/components/ui";
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
    program.change((s) => ({
      saved: [
        {
          id: crypto.randomUUID(),
          name: name.trim() || fallback,
          term: bundle.term.code,
          sections,
          createdAt: new Date().toISOString(),
        },
        ...s.saved,
      ],
    }));
    setName("");
  };

  const open = (sections: Record<string, string>) =>
    program.change(() => ({ planned: Object.keys(sections), locked: { ...sections } }));

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-0 flex-[1_1_240px] flex-col gap-1.5 text-sm font-semibold">
          Salvar esta grade
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={fallback}
            className="min-h-11 rounded-xl border border-line-strong px-3 text-[15px] font-normal"
          />
        </label>
        <button type="button" onClick={save} className={buttonClass.primary}>
          <BookmarkIcon size={17} />
          Salvar
        </button>
      </div>

      {saved.length > 0 && (
        <ul className="flex flex-col">
          {saved.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-soft py-2.5">
              <span className="flex flex-col">
                <strong className="text-[15px]">{p.name}</strong>
                <span className="text-[13px] text-muted">
                  {Object.keys(p.sections).length} disciplinas ·{" "}
                  {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </span>
              <span className="flex gap-1">
                <button type="button" onClick={() => open(p.sections)} className={buttonClass.ghost}>
                  Abrir
                </button>
                <button
                  type="button"
                  onClick={() => program.change((s) => ({ saved: s.saved.filter((x) => x.id !== p.id) }))}
                  className="inline-flex min-h-11 items-center rounded-xl px-3 font-semibold text-ink-2 hover:bg-soft"
                >
                  Excluir
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

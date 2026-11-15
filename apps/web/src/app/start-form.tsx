"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";

import { SearchIcon } from "@/components/icons";
import { buttonClass, Card } from "@/components/ui";
import type { ProgramSummary } from "@/lib/catalog-types";
import { useHydrated, useStudentStore } from "@/lib/store";

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase();
}

function describe(p: ProgramSummary) {
  return [p.degree, p.campus].filter(Boolean).join(" · ");
}

export function StartForm({ institution, programs }: { institution: string; programs: ProgramSummary[] }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const lastProgram = useStudentStore((s) => s.lastProgram);
  const visit = useStudentStore((s) => s.visit);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<ProgramSummary | null>(null);
  const listId = useId();

  const matches = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return programs;
    return programs.filter((p) => normalize(`${p.name} ${p.degree ?? ""} ${p.campus ?? ""} ${p.code}`).includes(q));
  }, [programs, query]);

  const last =
    hydrated && lastProgram?.institution === institution
      ? programs.find((p) => p.code.toLowerCase() === lastProgram.program)
      : undefined;

  function choose(program: ProgramSummary) {
    setSelected(program);
    setQuery(`${program.name}${program.degree ? ` (${program.degree})` : ""}`);
    setOpen(false);
  }

  function start() {
    if (!selected) return;
    visit(institution, selected.code);
    router.push(`/${institution}/${selected.code.toLowerCase()}/progresso`);
  }

  return (
    <Card className="flex min-w-0 flex-[1_1_460px] flex-col gap-6 p-6 sm:p-8">
      <h2 className="font-display text-2xl font-semibold tracking-tight">Comece por aqui</h2>

      {last && (
        <Link
          href={`/${institution}/${last.code.toLowerCase()}/grade`}
          className="flex items-center justify-between gap-3 rounded-xl border border-line bg-ground px-4 py-3 text-ink no-underline hover:border-line-strong"
        >
          <span className="flex flex-col">
            <span className="text-sm text-muted">Continuar de onde parou</span>
            <strong className="text-base">{last.name}</strong>
          </span>
          <span className="text-sm font-semibold text-brand">Abrir</span>
        </Link>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="program" className="text-sm font-semibold">
          1. Seu curso
        </label>
        <div className="relative">
          <div className="flex min-h-14 items-center gap-3 rounded-xl border-2 border-line-strong px-3.5 focus-within:border-brand">
            <SearchIcon size={20} className="flex-none text-muted" />
            <input
              id="program"
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={open && matches[active] ? `${listId}-${matches[active].code}` : undefined}
              autoComplete="off"
              placeholder="Busque pelo nome do curso"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
                setOpen(true);
                setActive(0);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 120)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setOpen(true);
                  setActive((i) => Math.min(i + 1, matches.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter" && open && matches[active]) {
                  e.preventDefault();
                  choose(matches[active]);
                } else if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
              className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
            />
          </div>
          {open && (
            <ul
              id={listId}
              role="listbox"
              className="absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-xl border border-line bg-surface py-1 shadow-lg"
            >
              {matches.length === 0 && <li className="px-4 py-3 text-sm text-muted">Nenhum curso encontrado.</li>}
              {matches.map((p, i) => (
                <li
                  key={p.code}
                  id={`${listId}-${p.code}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(p);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex cursor-pointer flex-col px-4 py-2.5 ${i === active ? "bg-brand-tint" : ""}`}
                >
                  <span className="text-[15px] font-semibold">{p.name}</span>
                  <span className="text-sm text-muted">{describe(p)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <span className="text-sm text-muted">
          {selected ? describe(selected) : `${programs.length} cursos da UFOP`}
        </span>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-semibold">2. O que você já cursou?</legend>
        <label className="flex cursor-pointer items-start gap-3.5 rounded-xl border-2 border-brand bg-brand-tint p-4">
          <input type="radio" name="method" defaultChecked className="mt-0.5 size-5 accent-brand" />
          <span className="flex flex-col gap-1">
            <strong>Marcar no mapa do curso</strong>
            <span className="text-sm leading-normal text-ink-2">
              Período por período: marque as disciplinas em que já foi aprovado.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3.5 rounded-xl border border-line p-4 opacity-70">
          <input type="radio" name="method" disabled className="mt-0.5 size-5" />
          <span className="flex flex-col gap-1">
            <strong>Importar histórico escolar (PDF) · em breve</strong>
            <span className="text-sm leading-normal text-muted">
              O arquivo será lido aqui no navegador, sem ser enviado para nenhum servidor.
            </span>
          </span>
        </label>
      </fieldset>

      <button type="button" onClick={start} disabled={!selected} className={`${buttonClass.primary} min-h-13 text-[17px]`}>
        Continuar
      </button>
    </Card>
  );
}

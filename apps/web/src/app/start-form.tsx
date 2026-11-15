"use client";

import { ArrowRight, ChevronsUpDown, FileUp, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { ProgramSummary } from "@/lib/catalog-types";
import { useHydrated, useStudentStore } from "@/lib/store";
import { nameKey } from "@/lib/transcript/match";
import type { Transcript } from "@/lib/transcript/parse";
import { readTranscriptFile } from "@/lib/transcript/read";
import { cn } from "@/lib/utils";

function describe(p: ProgramSummary) {
  return [p.degree, p.campus].filter(Boolean).join(" · ");
}

export function StartForm({ institution, programs }: { institution: string; programs: ProgramSummary[] }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const lastProgram = useStudentStore((s) => s.lastProgram);
  const visit = useStudentStore((s) => s.visit);
  const setPendingImport = useStudentStore((s) => s.setPendingImport);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ProgramSummary | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [choices, setChoices] = useState<{ transcript: Transcript; fileName: string; programs: ProgramSummary[] } | null>(
    null,
  );
  const fileInput = useRef<HTMLInputElement>(null);

  const last =
    hydrated && lastProgram?.institution === institution
      ? programs.find((p) => p.code.toLowerCase() === lastProgram.program)
      : undefined;

  const goTo = (program: ProgramSummary, page: "progresso" | "importar") => {
    visit(institution, program.code);
    router.push(`/${institution}/${program.code.toLowerCase()}/${page}`);
  };

  const startImport = (program: ProgramSummary, transcript: Transcript, fileName: string) => {
    setPendingImport({ institution, program: program.code, transcript, fileName });
    goTo(program, "importar");
  };

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    setReading(true);
    setError(null);
    setChoices(null);
    try {
      const transcript = await readTranscriptFile(file);
      // The transcript names the program but not its campus or degree.
      const key = transcript.programName ? nameKey(transcript.programName) : null;
      const candidates = selected
        ? [selected]
        : programs.filter((p) => key && nameKey(p.name) === key);
      if (candidates.length === 1) startImport(candidates[0], transcript, file.name);
      else if (candidates.length > 1) setChoices({ transcript, fileName: file.name, programs: candidates });
      else
        setError(
          `Não reconhecemos o curso “${transcript.programName ?? "?"}”. Escolha seu curso acima e importe de novo.`,
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível ler o arquivo");
    } finally {
      setReading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <section aria-labelledby="start" className="flex flex-col gap-6 rounded-2xl border bg-card p-6 sm:p-8">
      <h2 id="start" className="text-xl font-medium">
        Comece por aqui
      </h2>

      {last && (
        <Link
          href={`/${institution}/${last.code.toLowerCase()}/grade`}
          className="flex items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3 transition-colors hover:border-foreground/25"
        >
          <span className="flex flex-col">
            <span className="text-xs text-muted-foreground">Continuar de onde parou</span>
            <span className="text-sm font-medium">{last.name}</span>
          </span>
          <ArrowRight className="size-4 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
        </Link>
      )}

      <div className="flex flex-col gap-2">
        <span id="program-label" className="text-sm font-medium">
          Seu curso
        </span>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-labelledby="program-label"
              className={cn("h-12 justify-between px-4 text-base font-normal", !selected && "text-muted-foreground")}
            >
              <span className="truncate">{selected ? selected.name : "Busque pelo nome do curso"}</span>
              <ChevronsUpDown className="size-4 opacity-60" strokeWidth={1.5} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
            <Command>
              <CommandInput placeholder="Nome do curso" />
              <CommandList className="max-h-80">
                <CommandEmpty>Nenhum curso encontrado</CommandEmpty>
                <CommandGroup>
                  {programs.map((p) => (
                    <CommandItem
                      key={p.code}
                      value={`${p.name} ${describe(p)} ${p.code}`}
                      onSelect={() => {
                        setSelected(p);
                        setOpen(false);
                      }}
                      className="flex flex-col items-start gap-0"
                    >
                      <span>{p.name}</span>
                      <span className="text-xs text-muted-foreground">{describe(p)}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <span className="text-sm text-muted-foreground">
          {selected ? describe(selected) : `${programs.length} cursos da UFOP`}
        </span>
      </div>

      <Button size="lg" disabled={!selected} onClick={() => selected && goTo(selected, "progresso")}>
        Marcar o que já cursei
        <ArrowRight strokeWidth={1.5} />
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Separator className="flex-1" />
        ou
        <Separator className="flex-1" />
      </div>

      <div className="flex flex-col gap-2">
        <Button variant="outline" size="lg" disabled={reading} onClick={() => fileInput.current?.click()}>
          <FileUp strokeWidth={1.5} />
          {reading ? "Lendo o histórico…" : "Importar histórico escolar (PDF)"}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => void readFile(e.target.files?.[0])}
        />
        <p className="text-sm text-muted-foreground">
          Reconhece o curso e as disciplinas aprovadas. O arquivo é lido no seu navegador e não é enviado.
        </p>
      </div>

      {choices && (
        <div className="flex flex-col gap-2 rounded-xl border bg-background p-4">
          <p className="text-sm">Qual destes é o seu curso?</p>
          {choices.programs.map((p) => (
            <Button key={p.code} variant="outline" className="justify-between" onClick={() => startImport(p, choices.transcript, choices.fileName)}>
              {p.name}
              <span className="text-xs text-muted-foreground">{describe(p)}</span>
            </Button>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          {error}
        </p>
      )}
    </section>
  );
}

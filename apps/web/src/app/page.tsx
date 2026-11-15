import { CalendarDays, Check, LockKeyhole } from "lucide-react";

import { SiteFooter, SiteHeader } from "@/components/site-header";
import { WeekCalendar } from "@/components/week-calendar";
import { plan, DEFAULT_PREFERENCES } from "@/lib/scheduler";
import { getCoverage, getProgramBundle, listPrograms } from "@/server/catalog";

import { StartForm } from "./start-form";

const INSTITUTION = "ufop";

// The example on the home page: real sections from the current term.
const EXAMPLE = { program: "sjm", subjects: ["CSI106", "CSI301", "CSI701", "CSI602"] };

const POINTS = [
  {
    icon: Check,
    title: "Pré-requisitos conferidos para você",
    text: "Disciplinas e carga horária mínima, como estão na matriz do seu currículo",
  },
  {
    icon: CalendarDays,
    title: "Grades sem choque, do seu jeito",
    text: "Menos dias no campus, sem janelas, só à noite: você escolhe o que pesa mais",
  },
  {
    icon: LockKeyhole,
    title: "Sem cadastro",
    text: "Tudo fica salvo neste navegador, inclusive o histórico que você importar",
  },
];

export default async function Home() {
  const [programs, coverage, example] = await Promise.all([
    listPrograms(INSTITUTION),
    getCoverage(INSTITUTION),
    exampleOption(),
  ]);
  const termLabel = coverage ? termName(coverage.term) : null;

  return (
    <>
      <SiteHeader term={coverage?.term} />
      <main className="mx-auto grid w-full max-w-[1200px] items-center gap-12 px-4 pt-12 pb-16 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <section className="flex flex-col gap-6">
          {termLabel && <p className="text-sm text-muted-foreground">Universidade Federal de Ouro Preto · {termLabel}</p>}
          <h1 className="text-4xl leading-[1.05] font-medium tracking-tight text-balance sm:text-6xl">
            Monte seu semestre sem choque de horário
          </h1>
          <p className="max-w-[36rem] text-lg leading-relaxed text-ink-2">
            Escolha seu curso, diga o que já cursou e veja só as disciplinas que você pode fazer agora, com as
            combinações de turmas que cabem na sua rotina.
          </p>
          <ul className="flex flex-col gap-4 pt-2">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <Icon className="mt-0.5 size-[18px] flex-none text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{title}</span>
                  <span className="text-sm text-muted-foreground">{text}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <StartForm institution={INSTITUTION} programs={programs} />
      </main>

      {example && (
        <section aria-labelledby="example" className="mx-auto w-full max-w-[1200px] px-4 pb-16 sm:px-8">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="example" className="text-xl font-medium">
              Uma grade de verdade
            </h2>
            <p className="text-sm text-muted-foreground">
              {example.program}, {Object.keys(example.option.sections).length} disciplinas do 4º e 5º períodos,
              turmas de {coverage?.term}
            </p>
          </div>
          <WeekCalendar option={example.option} order={EXAMPLE.subjects} names={example.names} />
        </section>
      )}

      {coverage && (
        <section aria-label="Cobertura dos dados" className="mx-auto w-full max-w-[1200px] px-4 pb-12 sm:px-8">
          <dl className="flex flex-wrap gap-x-12 gap-y-4 border-t pt-8">
            <Stat value={coverage.programs} label="cursos" />
            <Stat value={coverage.departments} label="departamentos" />
            <Stat value={coverage.sections} label={`turmas em ${coverage.term}`} />
          </dl>
        </section>
      )}
      <SiteFooter syncedAt={coverage?.syncedAt} />
    </>
  );
}

async function exampleOption() {
  const bundle = await getProgramBundle(INSTITUTION, EXAMPLE.program);
  if (!bundle) return null;
  const { options } = plan({
    subjects: EXAMPLE.subjects,
    sections: bundle.sections,
    locked: {},
    preferences: DEFAULT_PREFERENCES,
    limit: 1,
  });
  if (!options[0]) return null;
  const names = Object.fromEntries(EXAMPLE.subjects.map((code) => [code, bundle.subjects[code]?.name ?? code]));
  return { option: options[0], names, program: bundle.program.name };
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dd className="text-2xl font-medium">{value.toLocaleString("pt-BR")}</dd>
      <dt className="text-sm text-muted-foreground">{label}</dt>
    </div>
  );
}

function termName(term: string) {
  const [year, half] = term.split("/");
  return `${half}º semestre de ${year}`;
}

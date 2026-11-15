import { CalendarIcon, CheckIcon, LockIcon } from "@/components/icons";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { getCoverage, listPrograms } from "@/server/catalog";

import { StartForm } from "./start-form";

const INSTITUTION = "ufop";

const POINTS = [
  {
    icon: CheckIcon,
    title: "Pré-requisitos conferidos para você",
    text: "Disciplinas e carga horária mínima, como estão na matriz do seu currículo.",
  },
  {
    icon: CalendarIcon,
    title: "Grades sem choque, do seu jeito",
    text: "Menos dias no campus, sem janelas, só à noite: você escolhe o que pesa mais.",
  },
  {
    icon: LockIcon,
    title: "Sem cadastro",
    text: "Tudo fica salvo neste navegador. Nada do que você marca sai do seu computador.",
  },
];

export default async function Home() {
  const [programs, coverage] = await Promise.all([listPrograms(INSTITUTION), getCoverage(INSTITUTION)]);
  const termLabel = coverage ? termName(coverage.term) : null;

  return (
    <>
      <SiteHeader term={coverage?.term} />
      <main className="mx-auto flex w-full max-w-[1200px] flex-wrap items-start gap-14 px-4 pb-14 pt-12 sm:px-8 sm:pt-16">
        <section className="flex min-w-0 flex-[1_1_420px] flex-col gap-7">
          {termLabel && (
            <p className="text-[15px] font-semibold text-brand">Universidade Federal de Ouro Preto · {termLabel}</p>
          )}
          <h1 className="font-display text-[40px] font-bold leading-[1.04] tracking-tight sm:text-[56px]">
            Monte seu semestre sem choque de horário.
          </h1>
          <p className="max-w-[34em] text-lg leading-relaxed text-ink-2 sm:text-[19px]">
            Escolha seu curso, diga o que já cursou e veja só as disciplinas que você pode fazer agora, com as
            combinações de turmas que cabem na sua rotina.
          </p>
          <ul className="flex flex-col gap-[18px]">
            {POINTS.map(({ icon: PointIcon, title, text }) => (
              <li key={title} className="flex items-start gap-3.5">
                <PointIcon size={22} className="mt-0.5 flex-none text-brand" />
                <div className="flex flex-col gap-1">
                  <strong className="text-base">{title}</strong>
                  <span className="text-[15px] leading-normal text-muted">{text}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <StartForm institution={INSTITUTION} programs={programs} />
      </main>

      {coverage && (
        <section aria-label="Cobertura dos dados" className="mx-auto w-full max-w-[1200px] px-4 pb-10 sm:px-8">
          <div className="flex flex-wrap gap-10 border-t border-line pt-7">
            <Stat value={coverage.programs} label="cursos" />
            <Stat value={coverage.departments} label="departamentos" />
            <Stat value={coverage.sections} label={`turmas em ${coverage.term}`} />
          </div>
        </section>
      )}
      <SiteFooter syncedAt={coverage?.syncedAt} />
    </>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-display text-[28px] font-semibold">{value.toLocaleString("pt-BR")}</span>
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}

function termName(term: string) {
  const [year, half] = term.split("/");
  return `${half}º semestre de ${year}`;
}

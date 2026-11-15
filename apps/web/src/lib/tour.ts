"use client";

import type { DriveStep } from "driver.js";
import { useEffect } from "react";

/**
 * "Como funciona": a guided walk through a page that highlights one part at a
 * time (driver.js). Each page's tour starts by itself on the first visit and
 * again from the header button. Steps point at `data-tour="…"` elements and
 * are skipped when that element is not on screen (empty states, phones).
 *
 * Action steps ask the student to do the thing (click Sugerir, pick an
 * option) and move on once they do. Steps marked `appears` point at elements
 * an earlier action creates, so they are kept and waited for.
 */

export type TourName = "progress" | "planner";

interface TourStep {
  /** `data-tour` value of the element to highlight; none for a centred card. */
  target?: string;
  title: string;
  description: string;
  /** The student has to do this to move on; the text says what (HTML allowed). */
  action?: { instruction: string; when?: (event: Event) => boolean };
  /** Rendered by an earlier action step, so it may not exist yet when the tour starts. */
  appears?: boolean;
}

/** A click on one of the option cards, not on the gaps between them. */
const clickedOption = (event: Event) => event.target instanceof Element && !!event.target.closest("button[aria-pressed]");

const TOURS: Record<TourName, TourStep[]> = {
  progress: [
    {
      title: "Como o grade funciona",
      description:
        "São três passos: marque o que você já cursou, monte a grade do semestre e salve. Tudo fica guardado neste navegador, sem precisar de conta.",
    },
    {
      target: "import",
      title: "Comece pelo histórico",
      description:
        "Importe o PDF do histórico do minhaUFOP e suas aprovações são marcadas sozinhas. O arquivo é lido aqui no navegador e não é enviado para lugar nenhum.",
    },
    {
      target: "mark-until",
      title: "Ou marque por período",
      description: "Se você já cursou tudo até um período, marque todos eles de uma vez por aqui.",
    },
    {
      target: "map",
      title: "Ajuste uma a uma",
      description:
        "Marque as disciplinas em que foi aprovado. O cadeado indica que ainda falta pré-requisito. Clique no nome para ver ementa, pré-requisitos e turmas.",
    },
    {
      target: "hours",
      title: "Quanto falta para formar",
      description: "As horas que você já cumpriu em obrigatórias, eletivas e atividades, contra o que o curso exige.",
    },
    {
      target: "next",
      title: "Por onde seguir",
      description:
        "As disciplinas liberadas que destravam mais coisas. “Montar grade com estas” leva você ao montador já com elas escolhidas.",
    },
    {
      target: "nav-grade",
      title: "Depois, monte a grade",
      description: "No montador você escolhe as disciplinas do semestre e compara combinações de turmas.",
    },
    {
      target: "help",
      title: "Quando precisar",
      description: "Este passo a passo fica aqui. Cada página tem o seu.",
    },
  ],
  planner: [
    {
      title: "Montar a grade",
      description:
        "Escolha as disciplinas que quer cursar. O grade combina as turmas sem choque de horário e dentro do limite de horas-aula por semana.",
    },
    {
      target: "add",
      title: "Adicione disciplinas",
      description:
        "Busque pelo nome ou pelo código. Só aparecem as que você já pode cursar e que têm turma neste semestre.",
    },
    {
      target: "available",
      title: "Ou escolha entre as liberadas",
      description: "As obrigatórias que você já pode cursar, do período mais antigo ao mais novo. Use o + para adicionar.",
    },
    {
      target: "suggest",
      title: "Experimente",
      description: "Para começar rápido, o grade escolhe as obrigatórias liberadas dos próximos períodos, até o seu limite semanal.",
      action: { instruction: "Clique em <b>Sugerir obrigatórias</b>." },
    },
    {
      target: "load",
      title: "O limite semanal",
      description:
        "Na UFOP, a maioria dos cursos permite até 32 horas-aula por semana, e o mínimo é 150 h no semestre. Se o seu curso usa outro limite, clique em Alterar limite.",
    },
    {
      target: "chosen",
      title: "Suas escolhas, por prioridade",
      description:
        "Se não couber tudo, pelo limite semanal ou por choque de horário, saem primeiro as de baixo. Use as setas para mudar a ordem e o menu para fixar uma turma.",
    },
    {
      target: "prefs",
      title: "Suas preferências",
      description: "Escolha os turnos, evite janelas entre aulas, junte tudo em menos dias ou use só turmas com vaga.",
    },
    {
      target: "options",
      title: "Compare as opções",
      description: "Até três combinações sem choque, da melhor para a pior, com as horas-aula por semana e os dias de aula de cada uma.",
      action: { instruction: "Clique em uma opção para vê-la no calendário.", when: clickedOption },
      appears: true,
    },
    {
      target: "calendar",
      title: "Sua semana",
      description: "A opção escolhida, dia a dia, com o horário e a turma de cada aula.",
      appears: true,
    },
    {
      target: "save",
      title: "Salve para não perder",
      description: "Dê um nome e salve. As grades salvas ficam aqui para comparar depois.",
      appears: true,
    },
    {
      target: "help",
      title: "Quando precisar",
      description: "Este passo a passo fica aqui. Cada página tem o seu.",
    },
  ],
};

const SEEN_KEY = "grade:tours";
const WAIT_MS = 4000;
let running = false;
let active: { destroy: () => void } | null = null;

function seen(): Partial<Record<TourName, boolean>> {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function markSeen(name: TourName) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify({ ...seen(), [name]: true }));
  } catch {
    // Private mode or full storage: the tour may simply show again.
  }
}

function visible(target: string): Element | null {
  const element = document.querySelector(`[data-tour="${target}"]`);
  return element && element.getClientRects().length > 0 ? element : null;
}

export async function startTour(name: TourName) {
  if (running) return;
  running = true;
  markSeen(name);
  const { driver } = await import("driver.js");

  // Keep what is on screen now, plus what an action kept here will create.
  let actionAhead = false;
  const steps: DriveStep[] = [];
  for (const step of TOURS[name]) {
    const present = !step.target || visible(step.target) !== null;
    if (!present && !(step.appears && actionAhead)) continue;
    if (step.action && step.target) actionAhead = true;
    steps.push({
      element: step.target ? `[data-tour="${step.target}"]` : undefined,
      waitForElement: present ? undefined : WAIT_MS,
      advanceOn: step.action
        ? { event: "click", when: step.action.when ? (_el, _step, { event }) => step.action!.when!(event) : undefined }
        : undefined,
      advanceDelay: step.action ? 500 : undefined,
      popover: {
        title: step.title,
        description: step.description,
        instruction: step.action?.instruction,
        // An action step moves on when the student does it, not from a button.
        showButtons: step.action ? ["previous", "close"] : undefined,
      },
    });
  }

  const tour = driver({
    steps,
    showProgress: true,
    progressText: "{{current}} de {{total}}",
    nextBtnText: "Próximo",
    prevBtnText: "Voltar",
    doneBtnText: "Entendi",
    popoverClass: "grade-tour",
    overlayColor: "#0f1720",
    overlayOpacity: 0.55,
    stagePadding: 6,
    stageRadius: 12,
    smoothScroll: true,
    onDestroyed: () => {
      running = false;
      active = null;
    },
  });
  active = tour;
  tour.drive();
}

/** Ends a running tour, e.g. when the student follows a link to another page. */
export function stopTour() {
  active?.destroy();
}

/** Starts the page's tour once, the first time this browser opens the page. */
export function useFirstVisitTour(name: TourName, ready: boolean) {
  useEffect(() => {
    if (!ready || seen()[name]) return;
    const timer = window.setTimeout(() => void startTour(name), 500);
    return () => window.clearTimeout(timer);
  }, [name, ready]);
}

export function tourFor(pathname: string): TourName | null {
  if (pathname.endsWith("/grade")) return "planner";
  if (pathname.endsWith("/progresso")) return "progress";
  return null;
}

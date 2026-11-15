import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "./ui";

export function SiteHeader({ children, term }: { children?: ReactNode; term?: string }) {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-8">
        <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
          <Link href="/" className="no-underline" aria-label="grade, página inicial">
            <Logo />
          </Link>
          {children}
        </div>
        {term && (
          <span className="rounded-full border border-line px-3 py-1.5 text-sm text-ink-2">UFOP · {term}</span>
        )}
      </div>
    </header>
  );
}

export function SiteFooter({ syncedAt }: { syncedAt?: string | null }) {
  const date = syncedAt ? new Date(syncedAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : null;
  return (
    <footer className="mt-auto border-t border-line">
      <p className="mx-auto max-w-[1400px] px-4 py-6 text-sm leading-relaxed text-muted sm:px-8">
        Dados públicos do Horário de Aulas e das matrizes curriculares da UFOP
        {date ? `, atualizados em ${date}` : ""}. Projeto independente, sem vínculo oficial com a universidade.
        Confira sempre no sistema acadêmico antes de se matricular.
      </p>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CalendarIcon, ChartIcon } from "@/components/icons";

const LINKS = [
  { path: "grade", label: "Montar grade", icon: CalendarIcon },
  { path: "progresso", label: "Progresso", icon: ChartIcon },
];

export function ProgramNav({ base }: { base: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="flex flex-wrap gap-1">
      {LINKS.map(({ path, label, icon: LinkIcon }) => {
        const href = `${base}/${path}`;
        const current = pathname === href;
        return (
          <Link
            key={path}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3.5 text-[15px] no-underline ${
              current ? "bg-soft font-semibold text-ink" : "font-medium text-ink-2 hover:bg-soft hover:text-ink"
            }`}
          >
            <LinkIcon size={17} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

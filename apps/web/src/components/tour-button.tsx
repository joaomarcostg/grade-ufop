"use client";

import { CircleHelp } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { startTour, stopTour, tourFor } from "@/lib/tour";

/** Replays the current page's "Como funciona" tour. */
export function TourButton() {
  const pathname = usePathname();
  const tour = tourFor(pathname);
  // A link followed mid-tour (say, "Montar grade com estas") leaves its page behind.
  useEffect(() => stopTour, [pathname]);
  if (!tour) return null;
  return (
    <Button variant="ghost" size="sm" data-tour="help" onClick={() => void startTour(tour)} className="text-ink-2">
      <CircleHelp strokeWidth={1.5} aria-hidden="true" />
      <span className="hidden sm:inline">Como funciona</span>
      <span className="sr-only sm:hidden">Como funciona</span>
    </Button>
  );
}

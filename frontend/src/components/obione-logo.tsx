import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * ObiOne mark — minimalist observatory symbol.
 * A circle (lens/observatory) with a single focal dot (the observed signal).
 * Uses currentColor so it adapts to dark/light themes automatically.
 */
export function ObiOneMark({ className, size = 24 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-label="ObiOne"
      role="img"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.25" fill="currentColor" />
    </svg>
  );
}

export function ObiOneWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ObiOneMark size={20} className="text-foreground" />
      <span className="text-sm font-semibold tracking-tight text-foreground">ObiOne</span>
      <span className="hidden sm:inline text-[10px] uppercase tracking-[0.18em] text-muted-foreground border-l border-border pl-2 ml-1">
        Observatory
      </span>
    </div>
  );
}

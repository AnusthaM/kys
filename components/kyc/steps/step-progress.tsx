import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepProgressProps {
  steps: { label: string; complete: boolean }[];
  current: number;
  onStepClick: (index: number) => void;
}

export function StepProgress({ steps, current, onStepClick }: StepProgressProps) {
  return (
    <div className="sticky top-0 z-10 -mx-8 mb-2 border-b bg-background/95 px-8 py-4 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex max-w-2xl items-center">
        {steps.map((s, i) => {
          const isCurrent = i === current;
          const isReachable = i <= current || s.complete;
          return (
            <div key={s.label} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                disabled={!isReachable}
                onClick={() => isReachable && onStepClick(i)}
                className="group flex flex-col items-center gap-1.5 disabled:cursor-not-allowed"
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold transition-all duration-200",
                    isCurrent
                      ? "border-primary bg-primary text-primary-foreground shadow-sm ring-4 ring-primary/15"
                      : s.complete
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground group-enabled:group-hover:border-primary/40"
                  )}
                >
                  {s.complete && !isCurrent ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "hidden text-[11px] transition-colors sm:block",
                    isCurrent ? "font-medium text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div className="mx-2 h-px flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    className={cn(
                      "h-full bg-primary transition-all duration-300",
                      i < current ? "w-full" : "w-0"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
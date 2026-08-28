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
                className="flex flex-col items-center gap-1.5 disabled:cursor-not-allowed"
              >
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-medium transition-colors",
                    isCurrent
                      ? "border-primary bg-primary text-primary-foreground"
                      : s.complete
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                  )}
                >
                  {s.complete && !isCurrent ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span className={cn("hidden text-[11px] sm:block", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                  {s.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div className={cn("mx-2 h-px flex-1 transition-colors", i < current ? "bg-primary" : "bg-border")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
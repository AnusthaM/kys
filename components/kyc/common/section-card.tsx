import { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface SectionCardProps {
  step: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
}

export function SectionCard({ step, icon: Icon, title, description, children }: SectionCardProps) {
  return (
    <Card className="border-border/60 shadow-sm transition-shadow duration-300 hover:shadow-md">
      <CardHeader className="gap-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Step {step}
            </p>
            <h2 className="text-base font-semibold leading-none">{title}</h2>
          </div>
        </div>
        {description && <p className="ml-13 text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="pt-2">{children}</CardContent>
    </Card>
  );
}
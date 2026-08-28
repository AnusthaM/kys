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
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="gap-1">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground">STEP {step}</p>
            <h2 className="text-base font-semibold leading-none">{title}</h2>
          </div>
        </div>
        {description && <p className="ml-12 text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="pt-2">{children}</CardContent>
    </Card>
  );
}
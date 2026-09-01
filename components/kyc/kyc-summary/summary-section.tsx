import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface SummarySectionProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

export function SummarySection({ title, icon: Icon, children }: SummarySectionProps) {
  return (
    <Card className="space-y-4 border-border/60 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        {Icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </Card>
  );
}

export function SummaryRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
//made the ui cleaner
//added drag and drop functionality for uploading documents
//date validations for date of birth and expiry date
//age validation for spouse age
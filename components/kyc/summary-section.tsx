import { Card } from "@/components/ui/card";

export function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="space-y-4 p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </Card>
  );
}

export function SummaryRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
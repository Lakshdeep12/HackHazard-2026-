import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "Something went wrong",
  description = "Unable to load data from backend.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
      <p className="text-sm font-semibold text-destructive">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      {onRetry && (
        <Button className="mt-3" size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

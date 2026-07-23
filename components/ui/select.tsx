import { cn } from "@/lib/utils";

export function Select({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-9 cursor-pointer rounded-md border border-border bg-card px-2.5 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
}

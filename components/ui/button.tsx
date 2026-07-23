import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border border-border bg-card hover:bg-accent",
  ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
  destructive:
    "border border-destructive/40 text-destructive hover:bg-destructive/10",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-2.5 text-xs",
  md: "h-9 px-3.5",
  icon: "size-9",
};

export function Button({
  variant = "outline",
  size = "md",
  className,
  type = "button",
  ...props
}: React.ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

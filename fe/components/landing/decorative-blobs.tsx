interface DecorativeBlobsProps {
  /** "hero" = accent + primary blur pair, "violet" = secondary + primary pair for variety. */
  variant?: "hero" | "violet";
}

/**
 * Purely decorative blurred gradient blobs used behind hero/CTA sections.
 * Must be rendered inside a `relative overflow-hidden` ancestor.
 * Motion is gated behind `motion-safe:` so it respects prefers-reduced-motion.
 */
export function DecorativeBlobs({ variant = "hero" }: DecorativeBlobsProps) {
  const [colorA, colorB] = variant === "violet" ? ["bg-secondary/10", "bg-primary/10"] : ["bg-accent/10", "bg-primary-300/10"];
  return (
    <div aria-hidden="true">
      <div className={`pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full ${colorA} blur-3xl motion-safe:animate-float`} />
      <div className={`pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full ${colorB} blur-3xl motion-safe:animate-float [animation-delay:1.2s]`} />
    </div>
  );
}

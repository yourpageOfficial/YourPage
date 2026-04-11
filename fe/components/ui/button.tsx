import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.96] cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-white shadow-md shadow-primary/25 hover:bg-primary-600 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5",
        secondary: "bg-accent text-white font-bold shadow-md shadow-accent/25 hover:bg-accent-600 hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5",
        outline: "border-2 border-primary-200 dark:border-primary-800 bg-white dark:bg-navy-800 text-gray-900 dark:text-gray-100 hover:border-primary hover:bg-primary-50 dark:hover:bg-primary-900/20",
        ghost: "text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary",
        destructive: "bg-error text-white shadow-md shadow-error/25 hover:bg-red-600",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 sm:h-9 px-3.5 text-xs sm:text-sm",
        lg: "h-12 sm:h-14 px-8 text-base sm:text-lg",
        icon: "h-9 w-9 sm:h-10 sm:w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, iconLeft, iconRight, children, disabled, ...props }, ref) => {
    if (asChild) return <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>{children}</Slot>;
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} disabled={disabled || loading} {...props}>
        {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : iconLeft ? <span className="mr-1.5 shrink-0">{iconLeft}</span> : null}
        {children}
        {iconRight && !loading && <span className="ml-1.5 shrink-0">{iconRight}</span>}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

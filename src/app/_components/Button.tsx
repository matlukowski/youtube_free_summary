"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "destructive";
  size?: "sm" | "md" | "lg" | "xl";
  children: ReactNode;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
}

const buttonVariants = {
  primary: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-700/30 border border-blue-600/20",
  secondary: "bg-slate-100/70 dark:bg-slate-700/70 hover:bg-slate-200/80 dark:hover:bg-slate-600/80 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-600/50 backdrop-blur-sm",
  ghost: "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-600/50",
  outline: "border border-slate-300 dark:border-slate-600 bg-transparent hover:bg-slate-50/50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100",
  destructive: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-600/25 hover:shadow-xl hover:shadow-red-700/30 border border-red-600/20"
};

const buttonSizes = {
  sm: "px-3 py-2 text-xs font-medium",
  md: "px-4 py-2.5 text-sm font-semibold",
  lg: "px-6 py-3 text-sm font-semibold",
  xl: "px-8 py-4 text-base font-semibold"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = "primary",
  size = "md",
  children,
  icon: Icon,
  iconPosition = "left",
  isLoading = false,
  loadingText,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}, ref) => {
  const isDisabled = disabled || isLoading;

  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";

  const variantClasses = buttonVariants[variant];
  const sizeClasses = buttonSizes[size];
  const widthClass = fullWidth ? "w-full" : "";

  const combinedClassName = `${baseClasses} ${variantClasses} ${sizeClasses} ${widthClass} ${className}`.trim();

  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          <LoadingSpinner
            size={size === "sm" ? "sm" : size === "xl" ? "md" : "sm"}
            className="text-current"
          />
          {loadingText && <span>{loadingText}</span>}
        </>
      );
    }

    const content = [
      Icon && iconPosition === "left" && (
        <Icon
          key="left-icon"
          className={`${size === "sm" ? "h-3 w-3" : size === "xl" ? "h-5 w-5" : "h-4 w-4"} transition-transform duration-200 group-hover:scale-110`}
        />
      ),
      <span key="content">{children}</span>,
      Icon && iconPosition === "right" && (
        <Icon
          key="right-icon"
          className={`${size === "sm" ? "h-3 w-3" : size === "xl" ? "h-5 w-5" : "h-4 w-4"} transition-transform duration-200 group-hover:scale-110`}
        />
      )
    ].filter(Boolean);

    return content;
  };

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={`${combinedClassName} group`}
      {...props}
    >
      {renderContent()}
    </button>
  );
});

Button.displayName = "Button";

// Utility function for creating button variants
export const createButtonVariant = (defaultVariant: ButtonProps["variant"]) =>
  forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant">>(
    (props, ref) => <Button ref={ref} variant={defaultVariant} {...props} />
  );

// Pre-built button variants for common use cases
export const PrimaryButton = createButtonVariant("primary");
export const SecondaryButton = createButtonVariant("secondary");
export const GhostButton = createButtonVariant("ghost");
export const OutlineButton = createButtonVariant("outline");
export const DestructiveButton = createButtonVariant("destructive");
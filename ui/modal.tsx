"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/ui/button";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-scrim/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-300",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { showCloseButton?: boolean }
>(({ className, children, showCloseButton = true, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-xl",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col gap-1 text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

const MODAL_SIZES = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
  "2xl": "sm:max-w-6xl",
} as const;

export type ModalSize = keyof typeof MODAL_SIZES;

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  /** One line under the title. */
  description?: React.ReactNode;
  children: React.ReactNode;
  /** sm 448 · md 512 (forms) · lg 672 (two-column forms) · xl 896 · 2xl 1152 (tables) */
  size?: ModalSize;
  className?: string;
}

/**
 * The one modal (see "Modals" in the design-system spec): title bar with a
 * close button, a body that scrolls, and a ModalFooter as the body's last
 * child (it sticks to the bottom).
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  className,
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn("flex max-h-[90vh] flex-col gap-0 p-0", MODAL_SIZES[size], className)}
        aria-describedby={undefined}
      >
        <DialogHeader className="border-b border-border px-6 py-4 pr-12">
          <DialogTitle className={!title ? "sr-only" : ""}>{title || "Dialog"}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Modal buttons, right-aligned: Cancel (outline) first, then the primary
 * action. Pass the buttons as children, or use the props for the usual pair.
 * Sits as the last child of the modal body (or of the form inside it) and
 * sticks to the modal's bottom edge.
 */
export function ModalFooter({
  onCancel,
  cancelLabel,
  submitLabel,
  pending = false,
  pendingLabel,
  submitDisabled = false,
  onSubmit,
  destructive = false,
  className,
  children,
}: {
  onCancel?: () => void;
  cancelLabel?: React.ReactNode;
  submitLabel?: React.ReactNode;
  pending?: boolean;
  pendingLabel?: React.ReactNode;
  submitDisabled?: boolean;
  /** Without it the primary button submits the surrounding form. */
  onSubmit?: () => void;
  destructive?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const t = useTranslations("Common");
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 -mx-6 -mb-5 mt-6 flex flex-col-reverse gap-2 border-t border-border bg-background px-6 py-4 sm:flex-row sm:justify-end",
        className
      )}
    >
      {children ?? (
        <>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
              {cancelLabel ?? t("cancel")}
            </Button>
          )}
          {submitLabel && (
            <Button
              type={onSubmit ? "button" : "submit"}
              variant={destructive ? "destructive" : "default"}
              onClick={onSubmit}
              disabled={pending || submitDisabled}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? (pendingLabel ?? submitLabel) : submitLabel}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};

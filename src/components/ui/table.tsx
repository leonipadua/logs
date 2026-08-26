import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Table({
  caption,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableElement> & { caption: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse text-body-sm", className)} {...props}>
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-surface-sunken", className)} {...props} />;
}

export function TableHeaderCell({
  className,
  align = "left",
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" }) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-2.5 text-label font-medium uppercase tracking-[0.02em] text-text-secondary",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-border-subtle", className)} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={className} {...props} />;
}

export function TableCell({
  className,
  align = "left",
  numeric,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right"; numeric?: boolean }) {
  return (
    <td
      className={cn(
        "px-4 py-2.5 text-text-primary",
        align === "right" ? "text-right" : "text-left",
        numeric && "tabular-nums",
        className,
      )}
      {...props}
    />
  );
}

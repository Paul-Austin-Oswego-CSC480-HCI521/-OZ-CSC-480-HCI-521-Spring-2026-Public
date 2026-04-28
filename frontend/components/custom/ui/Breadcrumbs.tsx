"use client";
import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = {
  label: string;
  href?: string;
};

export function Breadcrumbs({
  items,
  className = "",
}: {
  items: Crumb[];
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-sm font-semibold mb-3 flex items-center gap-1 flex-wrap ${className}`}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const content = isLast ? (
          <span className="text-muted-foreground font-normal">
            {item.label}
          </span>
        ) : item.href ? (
          <Link
            href={item.href}
            className="hover:underline"
            style={{ color: "#1E4B35" }}
          >
            {item.label}
          </Link>
        ) : (
          <span style={{ color: "#1E4B35" }}>{item.label}</span>
        );

        return (
          <React.Fragment key={i}>
            {content}
            {!isLast && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-8 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
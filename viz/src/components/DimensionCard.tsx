import type { ReactNode } from "react";

interface DimensionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function DimensionCard({ icon, title, description }: DimensionCardProps) {
  return (
    <div className="card flex flex-col items-start gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: "rgba(91,141,239,0.12)" }}
      >
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {description}
      </p>
    </div>
  );
}

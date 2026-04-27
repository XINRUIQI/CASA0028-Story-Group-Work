"use client";

import Link from "next/link";
import FairnessPanel from "@/components/FairnessPanel";

export default function FairnessPage() {
  return (
    <div className="fairness-full-page">
      <FairnessPanel />

      {/* ── Navigation ── */}
      <div className="fairness-nav-footer">
        <Link href="/compare" className="refl-nav-btn">
          ← Compare a journey
        </Link>
        <Link href="/reflection" className="refl-nav-btn refl-nav-secondary">
          Reflection & limitations →
        </Link>
      </div>
    </div>
  );
}

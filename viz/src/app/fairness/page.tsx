"use client";

import Link from "next/link";
import FairnessPanel from "@/components/FairnessPanel";

export default function FairnessPage() {
  return (
    <div className="fairness-full-page">
      <FairnessPanel />

      {/* ── Navigation ── */}
      <div className="fairness-nav-footer">
        <Link href="/compare" className="btn-primary px-6 py-3">
          Compare a journey →
        </Link>
        <Link href="/reflection" className="btn-secondary px-6 py-3">
          Reflection & limits
        </Link>
      </div>
    </div>
  );
}

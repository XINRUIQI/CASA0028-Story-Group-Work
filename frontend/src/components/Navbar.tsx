"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/overview", label: "Overview" },
  { href: "/compare", label: "Compare" },
  { href: "/unpack", label: "Unpack" },
  { href: "/fairness", label: "Fairness" },
  { href: "/choose", label: "Choose" },
  { href: "/reflection", label: "Reflection" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showBg = !isHome || scrolled;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b transition-all duration-500"
      style={{
        background: showBg ? "var(--bg-secondary)" : "transparent",
        borderColor: showBg ? "var(--border-subtle)" : "transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Moon size={20} style={{ color: "var(--accent-amber)" }} />
          <span>After Dark</span>
        </Link>

        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                style={{
                  color: active ? "var(--accent-blue)" : "var(--text-secondary)",
                  background: active ? "rgba(91,141,239,0.1)" : "transparent",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

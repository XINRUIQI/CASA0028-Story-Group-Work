"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/compare", label: "Compare" },
  { href: "/overview", label: "Context" },
  { href: "/unpack", label: "Mechanisms" },
  { href: "/fairness", label: "Fairness" },
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

  // Home page uses a dusk-themed frosted nav; other pages keep the dark theme
  const navBackground = showBg
    ? isHome
      ? "rgba(46, 36, 96, 0.55)"
      : "var(--bg-secondary)"
    : "transparent";
  const navBorder = showBg
    ? isHome
      ? "rgba(240, 184, 122, 0.22)"
      : "var(--border-subtle)"
    : "transparent";

  const brandColor = isHome ? "#fef5e8" : "var(--text-primary)";
  const brandAccent = isHome ? "#f0b87a" : "var(--accent-amber)";
  const linkInactiveColor = isHome ? "#f4d9b8" : "var(--text-secondary)";
  const linkActiveColor = isHome ? "#fff4e2" : "var(--champagne-gold)";
  const linkActiveBg = isHome
    ? "rgba(240, 184, 122, 0.22)"
    : "rgba(201,169,110,0.1)";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b transition-all duration-500"
      style={{
        background: navBackground,
        borderColor: navBorder,
        backdropFilter: showBg && isHome ? "blur(10px)" : undefined,
        WebkitBackdropFilter: showBg && isHome ? "blur(10px)" : undefined,
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-lg"
          style={{ color: brandColor }}
        >
          <Moon size={20} style={{ color: brandAccent }} />
          <span>Day and Night</span>
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
                  color: active ? linkActiveColor : linkInactiveColor,
                  background: active ? linkActiveBg : "transparent",
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/compare", label: "Compare" },
  { href: "/fairness", label: "Map" },
  { href: "/reflection", label: "Reflection" },
  { href: "/ending", label: "Thoughts" },
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

  const isEnding = pathname === "/ending";
  // Both Home and the Thoughts page use a hero-style cover image, so the nav
  // stays fully transparent on top until the user scrolls past the hero.
  const isCover = isHome || isEnding;
  const showBg = !isCover || scrolled;

  // Unified dusk-themed frosted nav across all pages.
  // The Thoughts page (background4.png) is a day/night split image, so we use
  // a warm amber-dusk wash with a soft gold border to bridge both halves.
  const navBackground = showBg
    ? isEnding
      ? "rgba(150, 95, 65, 0.40)"
      : "rgba(46, 36, 96, 0.55)"
    : "transparent";
  const navBorder = showBg
    ? isEnding
      ? "rgba(245, 198, 130, 0.34)"
      : "rgba(240, 184, 122, 0.22)"
    : "transparent";

  const brandColor = "#fef5e8";
  const brandAccent = "#f0b87a";
  const linkInactiveColor = "#f4d9b8";
  const linkActiveColor = "#fff4e2";
  const linkActiveBg = "rgba(240, 184, 122, 0.22)";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b transition-all duration-500"
      style={{
        background: navBackground,
        borderColor: navBorder,
        backdropFilter: showBg ? "blur(10px)" : undefined,
        WebkitBackdropFilter: showBg ? "blur(10px)" : undefined,
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

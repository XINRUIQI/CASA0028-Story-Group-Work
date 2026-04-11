"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { api, StopPointMatch } from "@/lib/api";

interface StopPointSearchProps {
  label: string;
  placeholder: string;
  onSelect: (match: StopPointMatch) => void;
  value?: string;
}

export default function StopPointSearch({
  label,
  placeholder,
  onSelect,
  value = "",
}: StopPointSearchProps) {
  const [query, setQuery] = useState(value);
  const [matches, setMatches] = useState<StopPointMatch[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) {
      setMatches([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.searchStopPoint(val);
        setMatches(res.matches);
        setOpen(true);
      } catch (err) {
        console.error("[StopPointSearch] fetch failed:", err);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  return (
    <div className="relative" ref={ref}>
      <label
        className="block text-sm font-medium mb-1.5"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </label>
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-muted)" }}
        />
        <input
          className="input-field pl-9"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => matches.length > 0 && setOpen(true)}
        />
        {loading && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            ...
          </span>
        )}
      </div>

      {open && matches.length > 0 && (
        <ul
          className="absolute z-40 w-full mt-1 rounded-lg border overflow-hidden max-h-60 overflow-y-auto"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-subtle)",
          }}
        >
          {matches.map((m) => (
            <li
              key={m.naptan_id}
              className="px-3 py-2.5 cursor-pointer transition-colors text-sm"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
              onClick={() => {
                onSelect(m);
                setQuery(m.name);
                setOpen(false);
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-card-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <div style={{ color: "var(--text-primary)" }}>{m.name}</div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {m.modes.join(", ")}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

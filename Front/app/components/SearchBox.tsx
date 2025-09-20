"use client";

import { useEffect, useRef, useState } from "react";
import { userService } from "@/app/services/api";

type UserRow = { id: number; username: string; role: string };

type Props = {
  hoveredElement: string | null;
  handleHover: (val: string | null) => void;
  onSelect?: (user: UserRow) => void; // click a dropdown item
  onSearch?: (q: string) => void; // press Enter or click magnifier
};

export default function SearchBox({
  hoveredElement,
  handleHover,
  onSelect,
  onSearch,
}: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<UserRow[]>([]);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Debounced quick search
  useEffect(() => {
    if (!open) return;
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      setErr(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErr(null);
    const t = setTimeout(async () => {
      try {
        const data = await userService.searchUsers(query);
        if (!cancelled) setResults(data);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Search failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, open]);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handlePick = (u: UserRow) => {
    setOpen(false);
    setQ("");
    setResults([]);
    onSelect?.(u);
  };

  const submitSearch = () => {
    const query = q.trim();
    if (!query) return;
    setOpen(false);
    onSearch?.(query);
  };

  return (
    <div
      ref={wrapRef}
      className="relative flex-1 py-0.5 flex-row flex items-center gap-2"
    >
      {/* Magnifier (click to submit) */}
      <button
        type="button"
        aria-label="Search"
        className={`text-4xl leading-none cursor-pointer transition-colors duration-200 ${
          hoveredElement === "search" ? "text-gray-400" : ""
        }`}
        onMouseEnter={() => handleHover("search")}
        onMouseLeave={() => handleHover(null)}
        onClick={submitSearch}
      >
        ⌕
      </button>

      {/* Your exact input styling */}
      <input
        type="text"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submitSearch();
        }}
        placeholder="Search here..."
        className={`px-2 py-3 border-2 w-11/12 h-8 border-black rounded-lg bg-black/5 cursor-text transition-opacity duration-200 focus:outline-none focus:border-black ${
          hoveredElement === "searchBar" ? "opacity-50" : ""
        }`}
        onMouseEnter={() => handleHover("searchBar")}
        onMouseLeave={() => handleHover(null)}
      />

      {/* Quick results dropdown */}
      {open && (
        <div className="absolute left-8 right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-md max-h-72 overflow-auto">
          {err && <div className="p-3 text-sm text-red-600">{err}</div>}
          {!loading && !err && results.length === 0 && q.trim().length >= 2 && (
            <div className="p-3 text-sm text-gray-500">No matches</div>
          )}
          <ul className="divide-y divide-gray-100">
            {results.map((u) => (
              <li key={u.id}>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-50"
                  onClick={() => handlePick(u)}
                >
                  <span className="font-medium">{u.username}</span>{" "}
                  <span className="text-gray-500">({u.role})</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

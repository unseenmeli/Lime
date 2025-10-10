"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type UserRow = { id: number; username: string; role: string };
type SongRow = {
  id: number;
  title: string;
  cover: string | null;
  owner?: { id?: number; username?: string } | null;
  genre?: string | null;
};

type Props = {
  hoveredElement: string | null;
  handleHover: (val: string | null) => void;
  onSelect?: (user: UserRow) => void; // user click
  onSearch?: (q: string) => void; // submit search
};

export default function SearchBox({
  hoveredElement,
  handleHover,
  onSelect,
  onSearch,
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Debounced quick search (users + songs by genre if no spaces)

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

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

      {/* Input */}
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

      {open && (
        <div className="absolute left-8 right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-md max-h-80 overflow-auto">
          {q.trim().length < 2 ? (
            <div className="p-3 text-sm text-gray-500">
              Type at least 2 characters…
            </div>
          ) : (
            <>
              {[
                { label: "Songs", type: "songs" },
                { label: "Artists", type: "artists" },
                { label: "Listeners", type: "listeners" },
              ].map(({ label, type }) => (
                <button
                  key={type}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between"
                  onClick={() => {
                    setOpen(false);
                    setQ("");
                    router.push(
                      `/search?q=${encodeURIComponent(q.trim())}&type=${type}`
                    );
                  }}
                >
                  <span>
                    Search for “{q.trim()}” in {label}
                  </span>
                  <span className="text-xs text-gray-500">↵</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

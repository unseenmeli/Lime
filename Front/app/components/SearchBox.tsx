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
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const checkTheme = () => {
      const body = document.body;
      const currentTheme = body.className.includes('bg-black') ? 'dark' : 'light';
      setTheme(currentTheme);
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

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

  const isDark = theme === "dark";

  return (
    <div
      ref={wrapRef}
      className="relative flex-1 py-0.5 flex-row flex items-center gap-2"
    >
      <button
        type="button"
        aria-label="Search"
        className={`text-4xl leading-none cursor-pointer transition-colors duration-200 ${
          isDark ? 'text-white' : 'text-black'
        } ${hoveredElement === "search" ? "text-gray-400" : ""}`}
        onMouseEnter={() => handleHover("search")}
        onMouseLeave={() => handleHover(null)}
        onClick={submitSearch}
      >
        ⌕
      </button>

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
        className={`px-2 py-3 border-2 w-11/12 h-8 rounded-lg cursor-text transition-opacity duration-200 focus:outline-none ${
          isDark
            ? 'border-white bg-white/5 text-white placeholder-gray-400 focus:border-white'
            : 'border-black bg-black/5 text-black focus:border-black'
        } ${hoveredElement === "searchBar" ? "opacity-50" : ""}`}
        onMouseEnter={() => handleHover("searchBar")}
        onMouseLeave={() => handleHover(null)}
      />

      {open && (
        <div className={`absolute left-8 right-0 top-12 border rounded-lg shadow-md max-h-80 overflow-auto ${
          isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
        }`}>
          {q.trim().length < 2 ? (
            <div className={`p-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
                  className={`w-full text-left px-3 py-2 flex items-center justify-between ${
                    isDark ? 'hover:bg-gray-900 text-white' : 'hover:bg-gray-50 text-black'
                  }`}
                  onClick={() => {
                    setOpen(false);
                    setQ("");
                    router.push(
                      `/search?q=${encodeURIComponent(q.trim())}&type=${type}`
                    );
                  }}
                >
                  <span>
                    Search for "{q.trim()}" in {label}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>↵</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

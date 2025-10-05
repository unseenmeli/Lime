"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { userService, songService } from "@/app/services/api";

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
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [userResults, setUserResults] = useState<UserRow[]>([]);
  const [songResults, setSongResults] = useState<SongRow[]>([]);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Debounced quick search (users + songs by genre if no spaces)
  useEffect(() => {
    if (!open) return;
    const query = q.trim();
    if (query.length < 2) {
      setUserResults([]);
      setSongResults([]);
      setErr(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErr(null);

    const timer = setTimeout(async () => {
      try {
        const [users, songs] = await Promise.all([
          userService.searchUsers(query),
          query.includes(" ")
            ? Promise.resolve([])
            : songService.searchSongsByGenre(query),
        ]);
        if (!cancelled) {
          setUserResults(users);
          setSongResults(songs.slice(0, 5)); // keep dropdown tight
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Search failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
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

  const handlePickUser = (u: UserRow) => {
    setOpen(false);
    setQ("");
    setUserResults([]);
    setSongResults([]);
    onSelect?.(u);
  };

  const handlePickSong = (s: SongRow) => {
    setOpen(false);
    setQ("");
    setUserResults([]);
    setSongResults([]);
    router.push(`/song/${s.id}`);
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

      {/* Quick results dropdown */}
      {open && (
        <div className="absolute left-8 right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-md max-h-80 overflow-auto">
          {err && <div className="p-3 text-sm text-red-600">{err}</div>}
          {loading && !err && <div className="p-3 text-sm">Searching…</div>}

          {!loading && !err && (
            <>
              {/* Users */}
              {userResults.length > 0 && (
                <>
                  <div className="px-3 pt-3 pb-1 text-xs uppercase tracking-wide text-gray-500">
                    users
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {userResults.map((u) => (
                      <li key={`u-${u.id}`}>
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-gray-50"
                          onClick={() => handlePickUser(u)}
                        >
                          <span className="font-medium">{u.username}</span>{" "}
                          <span className="text-gray-500">({u.role})</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Songs (by genre) */}
              {songResults.length > 0 && (
                <>
                  <div className="px-3 pt-3 pb-1 text-xs uppercase tracking-wide text-gray-500">
                    songs{" "}
                    {q && !q.includes(" ")
                      ? `with #${q.replace(/^#/, "")}`
                      : ""}
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {songResults.map((s) => (
                      <li key={`s-${s.id}`}>
                        <button
                          className="w-full px-3 py-2 hover:bg-gray-50 flex items-center gap-3 text-left"
                          onClick={() => handlePickSong(s)}
                          title="Open song"
                        >
                          <div className="w-8 h-8 rounded bg-gray-200 overflow-hidden flex items-center justify-center">
                            {s.cover ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={s.cover}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm text-gray-500">♪</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="leading-tight">{s.title}</div>
                            <div className="text-xs text-gray-500">
                              {s.owner?.username ?? "Unknown"}{" "}
                              {s.genre ? `· #${s.genre.replace(/^#/, "")}` : ""}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* No matches */}
              {userResults.length === 0 &&
                songResults.length === 0 &&
                q.trim().length >= 2 && (
                  <div className="p-3 text-sm text-gray-500">No matches</div>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

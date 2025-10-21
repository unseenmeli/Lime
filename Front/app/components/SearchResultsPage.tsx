"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { userService, songService } from "@/app/services/api";

type Row = {
  id: number;
  username: string;
  role: string;
  profile_picture: string | null;
  follower_count: number;
  is_following: boolean;
};

type SongRow = {
  id: number;
  title: string;
  audio: string;
  cover: string | null;
  owner: { id: number; username: string; role: string } | null;
  genre?: string | null;
};

export default function SearchResultsPage() {
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = (searchParams.get("q") || "").trim();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [songs, setSongs] = useState<SongRow[]>([]);

  function normalizeForSongs(q: string) {
    return q.trim().replace(/^#/, "");
  }

  const type = (searchParams.get("type") || "artists").toLowerCase() as
    | "artists"
    | "songs"
    | "listeners";

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setErr(null);
      setRows([]); // reusing for users
      setSongs([]);

      if (!q) return;
      setLoading(true);

      try {
        if (type === "artists") {
          const data = await userService.searchUsers(q, { role: "ARTIST" });
          if (!cancelled) setRows(data);
        } else if (type === "listeners") {
          const data = await userService.searchUsers(q, { role: "LISTENER" });
          if (!cancelled) setRows(data);
        } else {
          // songs: one combined search across 4 fields
          const data = await songService.searchSongsMulti(normalizeForSongs(q));
          if (!cancelled) setSongs(data);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Search failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [q, type]);

  const toggleFollow = async (username: string, isFollowing: boolean) => {
    try {
      const result = isFollowing
        ? await userService.unfollow(username)
        : await userService.follow(username);

      setRows((old) =>
        old.map((r) =>
          r.username === username
            ? {
                ...r,
                is_following: result.is_following,
                follower_count: result.follower_count,
              }
            : r
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  const currentUser =
    typeof window !== "undefined"
      ? (() => {
          try {
            return JSON.parse(localStorage.getItem("user") || "null");
          } catch {
            return null;
          }
        })()
      : null;

  const goToUser = (username: string) => {
    router.push(`/u/${username}`);
  };

  const isDark = theme === "dark";

  return (
    <div className="py-6">
      <h1 className={`text-2xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>results for "{q}"</h1>

      {loading && <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-black'}`}>Searching…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}

      <ul className="grid gap-4">
        {rows.map((u) => {
          const isSelf = currentUser && currentUser.username === u.username;
          return (
            <li
              key={u.id}
              className={`flex items-center gap-3 p-3 border rounded-lg ${
                isDark ? 'border-gray-800 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              {/* Clickable avatar+name area → go to /u/<username> */}
              <button
                type="button"
                className="flex items-center gap-3 flex-1 text-left"
                onClick={() => goToUser(u.username)}
              >
                <div className={`w-16 h-16 rounded-full overflow-hidden flex items-center justify-center ${
                  isDark ? 'bg-gray-800' : 'bg-gray-200'
                }`}>
                  {u.profile_picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.profile_picture}
                      alt={`${u.username} avatar`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {u.username[0]?.toUpperCase() ?? "U"}
                    </span>
                  )}
                </div>

                <div>
                  <div className={`font-medium leading-tight ${isDark ? 'text-white' : 'text-black'}`}>{u.username}</div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {u.role === "ARTIST" ? "Artist" : "Listener"} ·{" "}
                    {u.follower_count} follower
                    {u.follower_count === 1 ? "" : "s"}
                  </div>
                </div>
              </button>

              {/* Follow/Unfollow button (kept) */}
              <button
                disabled={isSelf}
                onClick={() => toggleFollow(u.username, u.is_following)}
                className={`text-sm px-3 py-1 border rounded-md ${
                  isSelf
                    ? isDark
                      ? "border-gray-800 text-gray-600 cursor-not-allowed"
                      : "border-gray-200 text-gray-400 cursor-not-allowed"
                    : u.is_following
                    ? isDark
                      ? "border-gray-700 bg-black hover:bg-gray-900 text-white"
                      : "border-gray-300 bg-white hover:bg-gray-100"
                    : isDark
                    ? "border-white hover:bg-white hover:text-black text-white"
                    : "border-black hover:bg-black hover:text-white"
                }`}
              >
                {isSelf ? "You" : u.is_following ? "Unfollow" : "Follow"}
              </button>
            </li>
          );
        })}
      </ul>

      <ul className="grid gap-3">
        {songs.map((s) => (
          <li
            key={s.id}
            className={`flex items-center gap-3 p-3 border rounded-lg ${
              isDark ? 'border-gray-800' : 'border-gray-200'
            }`}
            onClick={() => router.push(`/song/${s.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(`/song/${s.id}`);
              }
            }}
            title={`Open ${s.title}`}
          >
            {/* cover */}
            <div className={`w-18 h-18 rounded overflow-hidden flex items-center justify-center ${
              isDark ? 'bg-gray-800' : 'bg-gray-200'
            }`}>
              {s.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.cover}
                  alt={`${s.title} cover`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>♪</span>
              )}
            </div>

            {/* title/owner */}
            <div className="flex-1">
              <div className={`font-medium leading-tight ${isDark ? 'text-white' : 'text-black'}`}>{s.title}</div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {s.owner?.username ?? "Unknown"}{" "}
                {s.genre ? `· #${s.genre}` : ""}
              </div>
            </div>

            {/* open owner profile */}
            <button
              className={`text-sm px-3 py-1 border rounded-md ${
                isDark
                  ? 'border-white text-white hover:bg-white hover:text-black'
                  : 'border-black hover:bg-black hover:text-white'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (s.owner?.username) {
                  router.push(`/u/${encodeURIComponent(s.owner.username)}`);
                }
              }}
            >
              see artist
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

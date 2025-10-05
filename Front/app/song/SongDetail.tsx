"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth, songService } from "@/app/services/api";

type OwnerMini = { id: number; username: string; role: string } | null;

type SongDetailDTO = {
  id: number;
  title: string;
  description: string;
  audio: string;
  cover: string | null;
  is_public: boolean;
  duration_seconds: number | null;
  plays: number;
  created_at: string;
  owner: OwnerMini;
  // important extras we’ll render:
  genre?: string | null;
  likes_count: number;
  liked_by_me: boolean;
  waveform_data?: number[] | null;
};

function formatSeconds(s: number | null) {
  if (!s && s !== 0) return "—";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${sec}`;
}

function hashTag(g?: string | null) {
  if (!g) return "";
  const s = g.startsWith("#") ? g.slice(1) : g;
  return `#${s}`;
}

/** tiny waveform renderer */
function Waveform({ data }: { data?: number[] | null }) {
  const bars = useMemo(() => {
    if (data && data.length) return data.slice(0, 80);
    return Array.from({ length: 80 }, () => 0.55); // placeholder
  }, [data]);

  return (
    <div className="w-full h-24 flex items-end gap-[3px] px-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
      {bars.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${Math.max(8, Math.min(100, v * 100))}%`,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.35))",
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.6)",
          }}
        />
      ))}
    </div>
  );
}

export default function SongDetail() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [song, setSong] = useState<SongDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [likeBusy, setLikeBusy] = useState(false);

  const id = Number(params?.id ?? NaN);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id || Number.isNaN(id)) {
        setErr("Invalid song id.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setErr(null);
      try {
        const res = await fetchWithAuth(`/songs/${id}/`, { method: "GET" });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as SongDetailDTO;
        if (!cancelled) setSong(data);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Failed to load song.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function playCurrent() {
    if (!song) return;
    const queue = [
      {
        id: song.id,
        title: song.title,
        artist: song.owner?.username ?? "Unknown",
        url: song.audio,
        cover: song.cover,
        waveform_data: song.waveform_data ?? undefined,
      },
    ];
    window.dispatchEvent(
      new CustomEvent("player:play", {
        detail: { queue, startId: song.id },
      })
    );
  }

  async function toggleLike() {
    if (!song || likeBusy) return;
    setLikeBusy(true);
    try {
      const res = song.liked_by_me
        ? await songService.unlikeSong(song.id)
        : await songService.likeSong(song.id);

      setSong((prev) =>
        prev
          ? {
              ...prev,
              liked_by_me: res.liked_by_me,
              likes_count: res.likes_count,
            }
          : prev
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLikeBusy(false);
    }
  }

  // ===== UI =====
  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* bubbly frutiger-aero background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bubbles.png"
          alt=""
          className="absolute -z-10 inset-0 w-[1200px] opacity-70 blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#e7f7ff] via-[#f7fbff] to-white -z-[9]" />
        <div className="flex items-center justify-center h-[70vh]">
          <div className="animate-pulse px-6 py-4 rounded-2xl bg-white/60 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.20)] border border-white/50">
            Loading…
          </div>
        </div>
      </div>
    );
  }

  if (err || !song) {
    return (
      <div className="p-6">
        <p className="text-red-600">{err ?? "Song not found."}</p>
        <button
          className="mt-3 text-sm underline"
          onClick={() => router.back()}
        >
          go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* background: frutiger-aero-ish */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/profile_background.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-90 -z-10"
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-white/85 via-transparent to-white/85 -z-[9]" />
      {/* extra bubbles */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/bubbles.png"
        alt=""
        className="absolute right-[-120px] top-[-40px] w-[520px] opacity-70 -z-10"
      />
      {/* mac window */}
      <div className="mx-auto max-w-5xl pt-16 pb-24 px-4">
        <div className="rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.25)] border border-white/60 bg-white/30 backdrop-blur-xl">
          {/* title bar */}
          <div className="h-10 flex items-center justify-between px-4 border-b border-white/50 bg-white/35">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]" />
              <span className="w-3 h-3 rounded-full bg-yellow-400 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]" />
              <span className="w-3 h-3 rounded-full bg-green-400 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]" />
              <span className="ml-3 text-sm text-gray-700">tracks</span>
            </div>
            <button
              onClick={() => router.back()}
              className="text-xs px-2 py-1 rounded-md border border-white/60 bg-white/60 hover:bg-white/80"
            >
              ← back
            </button>
          </div>

          {/* content */}
          <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-6 p-6">
            {/* left column: cover + meta */}
            <div className="flex md:block items-start gap-4">
              <div className="w-[240px] h-[240px] rounded-xl overflow-hidden border border-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.25)] bg-white/60 flex items-center justify-center">
                {song.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={song.cover}
                    alt={`${song.title} cover`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-gray-500">♪</span>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <div className="text-xs uppercase tracking-wide text-gray-600">
                  artist
                </div>
                <div className="text-lg font-medium">
                  {song.owner?.username ? (
                    <Link
                      className="underline decoration-dotted hover:opacity-80"
                      href={`/u/${song.owner.username}`}
                    >
                      {song.owner.username}
                    </Link>
                  ) : (
                    "Unknown"
                  )}
                </div>

                <div className="pt-3">
                  <div className="text-xs uppercase tracking-wide text-gray-600">
                    genre
                  </div>
                  <div className="mt-1">
                    {song.genre ? (
                      <Link
                        className="inline-block text-sm px-2 py-1 rounded-full border border-white/70 bg-white/60 hover:bg-white/80 shadow"
                        href={`/search?q=${encodeURIComponent(
                          song.genre.startsWith("#")
                            ? song.genre.slice(1)
                            : song.genre
                        )}`}
                        title="search songs with this genre"
                      >
                        {hashTag(song.genre)}
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-500">—</span>
                    )}
                  </div>
                </div>

                <div className="pt-3">
                  <div className="text-xs uppercase tracking-wide text-gray-600">
                    length
                  </div>
                  <div className="text-sm">
                    {formatSeconds(song.duration_seconds)}
                  </div>
                </div>

                <div className="pt-3">
                  <div className="text-xs uppercase tracking-wide text-gray-600">
                    uploaded
                  </div>
                  <div className="text-sm">
                    {new Date(song.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* right column: title, controls, waveform, desc */}
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <h1
                  className="text-2xl md:text-3xl font-semibold text-gray-900"
                  style={{
                    textShadow:
                      "0 1px 0 rgba(255,255,255,0.6), 0 2px 16px rgba(0,0,0,0.15)",
                  }}
                >
                  {song.title}
                </h1>

                <div className="flex items-center gap-2">
                  {/* like */}
                  <button
                    onClick={toggleLike}
                    disabled={likeBusy}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg border border-white/70 bg-white/70 hover:bg-white/90 shadow ${
                      likeBusy ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    title={
                      song.liked_by_me ? "Unlike this track" : "Like this track"
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={song.liked_by_me ? "/liked.png" : "/unliked.png"}
                      alt={song.liked_by_me ? "Unlike" : "Like"}
                      className="w-5 h-5"
                    />
                    <span className="text-sm">{song.likes_count}</span>
                  </button>

                  {/* play */}
                  <button
                    onClick={playCurrent}
                    className="px-3 py-2 rounded-lg border border-black/80 bg-black text-white hover:opacity-85 shadow"
                    title="Play"
                  >
                    ▶ Play
                  </button>
                </div>
              </div>

              <Waveform data={song.waveform_data} />

              <div className="rounded-xl border border-white/60 bg-white/55 backdrop-blur-md p-4 shadow">
                <div className="text-sm font-medium mb-1">about this track</div>
                <div className="text-sm text-gray-800 whitespace-pre-wrap">
                  {song.description?.trim()
                    ? song.description
                    : "No description provided."}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600">
                <div>plays: {song.plays.toLocaleString()}</div>
                <div>id: {song.id}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* subtle glass footer blur */}
      <div className="fixed left-0 right-0 bottom-0 h-24 bg-gradient-to-t from-white/70 to-transparent pointer-events-none" />
    </div>
  );
}

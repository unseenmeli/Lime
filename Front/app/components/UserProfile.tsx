"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { userService, songService } from "@/app/services/api";

type UserDTO = {
  id: number;
  username: string;
  role: string;
  profile_picture: string | null;
  follower_count: number;
  is_following: boolean;
};

type SongItem = {
  id: number;
  title: string;
  audio: string;
  cover: string | null;
  owner?: { username: string };
};

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // one shared audio element to play any track from the list
  const audioRef = useRef<HTMLAudioElement>(null);
  const [nowPlayingId, setNowPlayingId] = useState<number | null>(null);

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

  const isSelf = !!(
    currentUser &&
    user &&
    currentUser.username === user.username
  );

  useEffect(() => {
    async function load() {
      if (!username) return;
      setErr(null);
      setLoading(true);
      try {
        // 1) user details
        const u = await userService.getUser(username);
        setUser(u);

        // 2) songs for this user (simple: list all then filter by owner)
        const all = await songService.listSongs();
        const mine = all.filter((s: any) => s.owner?.username === username);
        // map only what we need
        setSongs(
          mine.map((s: any) => ({
            id: s.id,
            title: s.title,
            audio: s.audio,
            cover: s.cover,
            owner: s.owner,
          }))
        );
      } catch (e: any) {
        setErr(e.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  async function toggleFollow() {
    if (!user || isSelf || saving) return;
    setSaving(true);
    try {
      const res = user.is_following
        ? await userService.unfollow(user.username)
        : await userService.follow(user.username);

      setUser((prev) =>
        prev
          ? {
              ...prev,
              is_following: res.is_following,
              follower_count: res.follower_count,
            }
          : prev
      );
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  function play(song: {
    id: number;
    title: string;
    audio: string;
    cover: string | null;
  }) {
    const queue = songs.map((s) => ({
      id: s.id,
      title: s.title,
      artist: user?.username ?? "Unknown",
      url: s.audio,
      cover: s.cover,
    }));

    window.dispatchEvent(
      new CustomEvent("player:play", {
        detail: { queue, startId: song.id },
      })
    );
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!user) return <div className="p-6">User not found</div>;

  return (
    <div className="flex flex-col w-full h-full overflow-hidden relative">
      {/* background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="absolute opacity-100 inset-0 w-full h-full object-cover -z-10"
        src="/profile_background.jpg"
        alt=""
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white -z-[9]" />

      {/* hidden shared audio element */}
      <audio ref={audioRef} onEnded={() => setNowPlayingId(null)} />

      {/* top actions */}
      <div className="h-30 w-full flex gap-10 justify-center py-10">
        <button
          onClick={toggleFollow}
          disabled={isSelf || saving}
          className="font-bold text-2xl hover:opacity-70 disabled:opacity-50"
        >
          {isSelf
            ? "you"
            : user.is_following
            ? saving
              ? "unfollowing…"
              : "unfollow"
            : saving
            ? "following…"
            : "follow"}
        </button>
        <p className="font-bold text-2xl">message</p>
        <p className="font-bold text-2xl">invite</p>
      </div>

      {/* main two columns */}
      <div className="flex-row flex">
        {/* left: avatar + name */}
        <div className="h-full w-100">
          <div className="flex justify-center items-center h-full flex-col">
            <p className="font-bold text-3xl pb-2">
              {user.username}
              {", "}
              {user.follower_count.toLocaleString()}
            </p>

            {user.profile_picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="border-2 w-70 h-70 shadow-[0_0_10px_rgba(0,0,0,0.5)] object-cover"
                src={user.profile_picture}
                alt={`${user.username} avatar`}
              />
            ) : (
              <div className="w-70 h-70 border-2 shadow-[0_0_10px_rgba(0,0,0,0.5)] bg-gray-300 flex items-center justify-center">
                <span className="text-4xl text-white font-bold">
                  {user.username[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* right: tracks list */}
        <div className="flex-1">
          <p className="font-bold text-3xl px-10 py-5">tracks</p>

          {songs.length === 0 && (
            <div className="px-10 py-2 text-gray-600">No tracks yet.</div>
          )}

          {songs.map((song) => (
            <div key={song.id} className="px-10 flex items-center gap-4 py-2">
              {/* cover */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {song.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="w-30 h-30 shadow-[0_0_10px_rgba(0,0,0,0.5)] object-cover"
                  src={song.cover}
                  alt={`${song.title} cover`}
                />
              ) : (
                <div className="w-30 h-30 shadow-[0_0_10px_rgba(0,0,0,0.5)] bg-gray-300 flex items-center justify-center">
                  <span className="text-lg text-white font-bold">♪</span>
                </div>
              )}

              {/* play button */}
              <button
                className="text-2xl hover:opacity-70"
                onClick={() => play(song)}
                aria-label={nowPlayingId === song.id ? "pause" : "play"}
              >
                {nowPlayingId === song.id ? "❚❚" : "▶"}
              </button>

              {/* fake waveform + song title overlay (same style as mock) */}
              <div className="flex items-center gap-[2px] flex-1 h-12 relative">
                {[...Array(30)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gray-400"
                    style={{ height: `${Math.random() * 70 + 30}%` }}
                  />
                ))}
                <p
                  className="absolute inset-0 flex items-center justify-center text-white font-extrabold text-lg pointer-events-none"
                  style={{
                    textShadow:
                      "2px 2px 0 black, -2px -2px 0 black, 2px -2px 0 black, -2px 2px 0 black, 1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 0 2px 0 black, 0 -2px 0 black, 2px 0 0 black, -2px 0 0 black",
                  }}
                >
                  {song.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

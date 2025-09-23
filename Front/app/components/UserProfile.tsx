"use client";

import { use, useEffect, useRef, useState } from "react";
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
  description?: string;
  is_public: boolean;
  likes_count: number;
  liked_by_me: boolean;
  owner?: { username: string };
};

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [likeBusyId, setLikeBusyId] = useState<number | null>(null);

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

        const all = await songService.listSongs();
        const mine = all.filter((s: any) => s.owner?.username === username);
        setSongs(
          mine.map((s: any) => ({
            id: s.id,
            title: s.title,
            audio: s.audio,
            cover: s.cover,
            description: s.description,
            is_public: s.is_public,
            likes_count: s.likes_count,
            liked_by_me: s.liked_by_me,
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

  // For menu to work when clicked anywhere on the screen
  const menuRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const buttonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (menuOpenId == null) return;

      const menuEl = menuRefs.current.get(menuOpenId) || null;
      const btnEl = buttonRefs.current.get(menuOpenId) || null;
      const target = e.target as Node;

      // If click is NOT inside the open menu or its toggle button, close it
      if (
        (!menuEl || !menuEl.contains(target)) &&
        (!btnEl || !btnEl.contains(target))
      ) {
        setMenuOpenId(null);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpenId(null);
    }

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpenId]);
  // Menu click END

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

  function startEdit(song: SongItem) {
    setEditId(song.id);
    setEditTitle(song.title);
    setEditDesc(song.description || "");
    setMenuOpenId(null);
  }

  async function saveEdit() {
    if (editId == null) return;
    setBusyId(editId);
    try {
      const updated = await songService.updateSong(editId, {
        title: editTitle.trim(),
        description: editDesc,
      });
      setSongs((prev) =>
        prev.map((s) =>
          s.id === editId
            ? { ...s, title: updated.title, description: updated.description }
            : s
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId(null);
      setEditId(null);
    }
  }

  async function toggleVisibility(song: SongItem) {
    setBusyId(song.id);
    try {
      const updated = await songService.updateSong(song.id, {
        is_public: !song.is_public,
      });
      setSongs((prev) =>
        prev.map((s) =>
          s.id === song.id ? { ...s, is_public: updated.is_public } : s
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId(null);
      setMenuOpenId(null);
    }
  }

  async function deleteSong(song: SongItem) {
    if (!confirm(`Delete "${song.title}"? This cannot be undone.`)) return;
    setBusyId(song.id);
    try {
      await songService.deleteSong(song.id);
      setSongs((prev) => prev.filter((s) => s.id !== song.id));
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId(null);
      setMenuOpenId(null);
    }
  }

  async function toggleLike(song: SongItem) {
    if (!user) return;
    const currentUser =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("user") || "null")
        : null;

    const isSelf =
      currentUser && currentUser.username === (song.owner?.username ?? "");
    if (isSelf) return;

    setLikeBusyId(song.id);
    try {
      const res = song.liked_by_me
        ? await songService.unlikeSong(song.id)
        : await songService.likeSong(song.id);

      setSongs((prev) =>
        prev.map((s) =>
          s.id === song.id
            ? {
                ...s,
                liked_by_me: res.liked_by_me,
                likes_count: res.likes_count,
              }
            : s
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLikeBusyId(null);
    }
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
          className="font text-2xl hover:opacity-70 disabled:opacity-50"
        >
          {isSelf
            ? "you"
            : user.is_following
            ? saving
              ? null
              : "unfollow"
            : saving
            ? null
            : "follow"}
        </button>
      </div>

      {/* main two columns */}
      <div className="flex-row flex">
        {/* left: avatar + name */}
        <div className="h-full w-100">
          <div className="flex justify-center items-center h-full flex-col">
            <p className="font text-3xl pb-2">
              {user.username}
              {" - "}
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
                <span className="text-4xl text-white font">
                  {user.username[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* right: tracks list */}
        <div className="flex-1">
          <p className="font text-3xl px-10 py-5">tracks</p>

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
                  <span className="text-lg text-white font">♪</span>
                </div>
              )}

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
                  className="absolute inset-0 flex items-center justify-center text-green-200 font text-lg pointer-events-none"
                  style={{
                    textShadow:
                      "2px 2px 0 black, -2px -2px 0 black, 2px -2px 0 black, -2px 2px 0 black, 1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 0 2px 0 black, 0 -2px 0 black, 2px 0 0 black, -2px 0 0 black",
                  }}
                >
                  {song.title}
                </p>
                {isSelf && (
                  <div className="relative">
                    <button
                      ref={(el) => {
                        if (el) buttonRefs.current.set(song.id, el);
                        else buttonRefs.current.delete(song.id);
                      }}
                      className="text-xl px-2 hover:opacity-70"
                      onClick={() =>
                        setMenuOpenId(menuOpenId === song.id ? null : song.id)
                      }
                      aria-label="More"
                      title="More"
                    >
                      ⋯
                    </button>

                    {menuOpenId === song.id && (
                      <div
                        ref={(el) => {
                          if (el) menuRefs.current.set(song.id, el);
                          else menuRefs.current.delete(song.id);
                        }}
                        className="absolute z-10 mt-2 w-30 bg-white border border-gray-200 rounded shadow"
                        role="menu"
                        aria-labelledby={`song-menu-${song.id}`}
                      >
                        <button
                          className="block w-full text-left px-3 py-1 hover:bg-gray-100"
                          disabled={busyId === song.id}
                          onClick={() => toggleVisibility(song)}
                        >
                          {song.is_public ? "Make private" : "Make public"}
                        </button>
                        <button
                          className="block w-full text-left px-3 py-1 hover:bg-gray-100"
                          onClick={() => startEdit(song)}
                        >
                          Edit
                        </button>
                        <button
                          className="block w-full text-left px-3 py-1 text-red-600 hover:bg-red-50"
                          disabled={busyId === song.id}
                          onClick={() => deleteSong(song)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {editId === song.id && (
                  <div className="px-10 py-3 flex flex-col gap-2">
                    <input
                      className="border rounded px-2 py-1"
                      placeholder="Title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <textarea
                      className="border rounded px-2 py-1"
                      placeholder="Description"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={busyId === song.id}
                        className="border px-3 py-1 rounded hover:bg-black hover:text-white"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="border px-3 py-1 rounded hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      {/* play button */}
                      <div className="flex">
                        <button
                          className="text-2xl hover:opacity-70"
                          onClick={() => play(song)}
                          aria-label={
                            nowPlayingId === song.id ? "pause" : "play"
                          }
                        >
                          {nowPlayingId === song.id ? "❚❚" : "▶"}
                        </button>

                        {/* Like button */}
                        {(() => {
                          const isOwnSong =
                            !!currentUser &&
                            currentUser.username ===
                              (song.owner?.username ?? "");
                          const isLiked = !!song.liked_by_me;

                          return (
                            <button
                              onClick={() => toggleLike(song)}
                              disabled={likeBusyId === song.id || isOwnSong} // still unclickable on own song
                              className={`relative z-10 flex items-center gap-1 px-2 py-1 rounded transition-opacity
        ${isOwnSong ? "cursor-not-allowed" : "hover:opacity-80"}`}
                              title={
                                isOwnSong
                                  ? "You can't like your own song"
                                  : isLiked
                                  ? "Unlike"
                                  : "Like"
                              }
                              aria-label={isLiked ? "Unlike" : "Like"}
                            >
                              {/* Heart icon:*/}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className="w-8 h-8"
                              >
                                <path
                                  d="M12 21s-6.146-3.662-9-7.2C1.2 12.08 1 10.4 2.1 9.1A4.2 4.2 0 0 1 8 9.2l.6.6.6-.6a4.2 4.2 0 0 1 5.9 0c1.1 1.3.9 2.98-.9 4.7-2.854 3.538-9 7.2-9 7.2Z"
                                  fill={
                                    isOwnSong
                                      ? "none"
                                      : isLiked
                                      ? "#C3D772"
                                      : "none" // fill on liked only
                                  }
                                  stroke={isOwnSong ? "#9CA3AF" : "#C3D772"} // gray when own; lime otherwise
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span
                                className={`text-sm ${
                                  isOwnSong ? "text-gray-600" : "text-gray-700"
                                }`}
                              >
                                {song.likes_count}
                              </span>
                            </button>
                          );
                        })()}
                      </div>
                    </div>
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

                {/* Like button */}
                {(() => {
                  const isOwnSong =
                    !!currentUser &&
                    currentUser.username === (song.owner?.username ?? "");
                  const isLiked = !!song.liked_by_me;

                  return (
                    <button
                      onClick={() => toggleLike(song)}
                      disabled={likeBusyId === song.id || isOwnSong} // still unclickable on own song
                      className={`relative z-10 flex items-center gap-1 px-2 py-1 rounded transition-opacity
        ${isOwnSong ? "cursor-not-allowed" : "hover:opacity-80"}`}
                      title={
                        isOwnSong
                          ? "You can't like your own song"
                          : isLiked
                          ? "Unlike"
                          : "Like"
                      }
                      aria-label={isLiked ? "Unlike" : "Like"}
                    >
                      {/* Heart icon:*/}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-8 h-8"
                      >
                        <path
                          d="M12 21s-6.146-3.662-9-7.2C1.2 12.08 1 10.4 2.1 9.1A4.2 4.2 0 0 1 8 9.2l.6.6.6-.6a4.2 4.2 0 0 1 5.9 0c1.1 1.3.9 2.98-.9 4.7-2.854 3.538-9 7.2-9 7.2Z"
                          fill={
                            isOwnSong ? "none" : isLiked ? "#C3D772" : "none" // fill on liked only
                          }
                          stroke={isOwnSong ? "#9CA3AF" : "#C3D772"} // gray when own; lime otherwise
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span
                        className={`text-sm ${
                          isOwnSong ? "text-gray-600" : "text-gray-700"
                        }`}
                      >
                        {song.likes_count}
                      </span>
                    </button>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

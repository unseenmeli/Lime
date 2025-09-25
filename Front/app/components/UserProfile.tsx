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
  const [descOpenId, setDescOpenId] = useState<number | null>(null);
  const [macWebTools, setMacWebTools] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [nowPlayingId, setNowPlayingId] = useState<number | null>(null);

  const [winPos, setWinPos] = useState<{ x: number; y: number }>({
    x: 700,
    y: 190,
  });
  const dragRef = useRef<{
    sx: number;
    sy: number;
    ox: number;
    oy: number;
  } | null>(null);
  const winRef = useRef<HTMLDivElement | null>(null);

  const openDesc = (id: number) => {
    setMenuOpenId(null);
    setDescOpenId(id);
  };
  const closeDesc = () => setDescOpenId(null);

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

  function onBarDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      ox: winPos.x,
      oy: winPos.y,
    };
  }
  function onBarMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.sx;
    const dy = e.clientY - dragRef.current.sy;
    setWinPos({
      x: Math.max(0, dragRef.current.ox + dx),
      y: Math.max(0, dragRef.current.oy + dy),
    });
  }
  function onBarUp(e: React.PointerEvent) {
    dragRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }

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
        {/* right: tracks list in a draggable window */}
        <div
          ref={winRef}
          className="fixed z-50 w-[760px] rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.25)] border border-gray-300 overflow-hidden backdrop-blur-sm"
          style={{ left: winPos.x, top: winPos.y }}
        >
          {/* Title bar (drag handle) */}
          <div
            className="cursor-move select-none h-10 px-4 flex items-center justify-between 
           bg-white/20 border-b border-white/60"
            onPointerDown={onBarDown}
            onPointerMove={onBarMove}
            onPointerUp={onBarUp}
          >
            <span className="font text-lg">tracks</span>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onMouseEnter={() => setMacWebTools(true)}
              onMouseLeave={() => setMacWebTools(false)}
            >
              <div className="w-3 h-3 rounded-full bg-green-400 flex items-center justify-center">
                <p
                  className={`text-[8px] text-green-800 font-bold opacity-0 transition-opacity duration-200 ${
                    macWebTools ? "opacity-100" : null
                  }`}
                >
                  +
                </p>
              </div>
              <div className="w-3 h-3 rounded-full bg-yellow-400 flex items-center justify-center">
                <p
                  className={`text-[8px] text-yellow-800 font-bold opacity-0 transition-opacity duration-200 ${
                    macWebTools ? "opacity-100" : null
                  }`}
                >
                  −
                </p>
              </div>
              <div className="w-3 h-3 rounded-full bg-red-400 flex items-center justify-center">
                <p
                  className={`text-[8px] text-red-800 font-bold opacity-0 transition-opacity duration-200 ${
                    macWebTools ? "opacity-100" : null
                  }`}
                >
                  ×
                </p>
              </div>
            </div>
          </div>

          {/* Window body (scrolls if many tracks) */}
          <div className="bg-white/90 max-h-[70vh] overflow-auto">
            {songs.length === 0 && (
              <div className="px-10 py-2 text-gray-600">No tracks yet.</div>
            )}
            {songs.map((song) => (
              <div key={song.id} className="px-10 flex items-center gap-4 py-3">
                {/* cover */}
                <button
                  type="button"
                  onClick={() => openDesc(song.id)}
                  className="w-30 h-30 shadow-[0_0_10px_rgba(0,0,0,0.5)] focus:outline-none focus:ring-2 focus:ring-white/60 rounded overflow-hidden"
                  aria-label={`View description for ${song.title} by ${song.owner}`}
                >
                  {song.cover ? (
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
                </button>

                {/* waveform + title + menu (unchanged logic, slight positioning tweak only) */}
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-[2px] h-12 relative">
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
                      <div className="absolute right-0 -top-7 z-30">
                        <button
                          ref={(el) => {
                            if (el) buttonRefs.current.set(song.id, el);
                            else buttonRefs.current.delete(song.id);
                          }}
                          className="text-xl px-2 hover:opacity-70"
                          onClick={() =>
                            setMenuOpenId(
                              menuOpenId === song.id ? null : song.id
                            )
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
                            className="absolute top-full right-1 mt-2 w-32 bg-white border border-gray-200 rounded shadow z-40"
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
                  </div>

                  {/* Play / Like (unchanged) */}
                  <div className="flex items-center gap-2">
                    <button
                      className="text-2xl hover:opacity-70"
                      onClick={() => play(song)}
                      aria-label={nowPlayingId === song.id ? "pause" : "play"}
                    >
                      {nowPlayingId === song.id ? "❚❚" : "▶"}
                    </button>

                    {(() => {
                      const isOwnSong =
                        !!currentUser &&
                        currentUser.username === (song.owner?.username ?? "");
                      const isLiked = !!song.liked_by_me;

                      return (
                        <button
                          onClick={() => toggleLike(song)}
                          disabled={likeBusyId === song.id || isOwnSong}
                          className={`relative flex items-center gap-1 px-2 py-1 rounded transition-opacity ${
                            isOwnSong
                              ? "cursor-not-allowed"
                              : "hover:opacity-80"
                          }`}
                          title={
                            isOwnSong
                              ? "You can't like your own song"
                              : isLiked
                              ? "Unlike"
                              : "Like"
                          }
                          aria-label={isLiked ? "Unlike" : "Like"}
                        >
                          <img
                            src={isLiked ? "/liked.png" : "/unliked.png"}
                            alt={isLiked ? "Unlike" : "Like"}
                            className="w-6 h-6"
                          />
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
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* === DESCRIPTION MODAL (one instance) === */}
      {descOpenId !== null &&
        (() => {
          const s = songs.find((s) => s.id === descOpenId);
          if (!s) return null;

          return (
            <div
              className="fixed inset-0 z-50"
              role="dialog"
              aria-modal="true"
              aria-labelledby="song-desc-title"
            >
              {/* overlay click-catcher */}
              <button
                className="fixed inset-0 bg-black/50"
                aria-label="Close description"
                onClick={closeDesc}
              />
              {/* dialog panel */}
              <div
                className="fixed left-1/2 top-1/2 w-[min(90vw,640px)] max-h-[80vh] -translate-x-1/2 -translate-y-1/2
                          rounded-xl border border-white/20 bg-white p-6 shadow-xl overflow-auto"
              >
                <div className="flex items-center gap-1 w-full pl-2">
                  <h2 id="song-desc-title" className="text-xl mb-5 mr-5">
                    {s.title}
                  </h2>
                  <div className="ml-auto mb-15 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="w-3 h-3 rounded-full bg-orange-500" />
                    <button
                      type="button"
                      onClick={closeDesc}
                      aria-label="Close"
                      title="Close"
                      className="inline-block w-3 h-3 rounded-full bg-red-600 p-0 border-0 align-middle"
                    >
                      <span className="w-3 h-3 rounded-full bg-red-600" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 whitespace-pre-wrap text-gray-800">
                  {s.description?.trim()
                    ? s.description
                    : "No description provided."}
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}

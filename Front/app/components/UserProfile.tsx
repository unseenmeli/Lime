"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { userService } from "@/app/services/api";

type UserDTO = {
  id: number;
  username: string;
  role: string;
  profile_picture: string | null;
  follower_count: number;
  is_following: boolean; // provided by API (requires request context)
};

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
        const data = await userService.getUser(username);
        setUser(data);
      } catch (e: any) {
        setErr(e.message || "Failed to load user");
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

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!user) return <div className="p-6">User not found</div>;

  return (
    <div className="py-6">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
          {user.profile_picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profile_picture}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl text-gray-500">
              {user.username[0]?.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{user.username}</h1>
          <p className="text-gray-600">
            {user.role === "ARTIST" ? "Artist" : "Listener"}
          </p>
          <p className="text-gray-600">
            {user.follower_count} follower{user.follower_count === 1 ? "" : "s"}
          </p>
        </div>

        {/* Follow / Unfollow */}
        <button
          disabled={isSelf || saving}
          onClick={toggleFollow}
          className={`text-sm px-3 py-1 border rounded-md ${
            isSelf
              ? "border-gray-200 text-gray-400 cursor-not-allowed"
              : user.is_following
              ? "border-gray-300 bg-white hover:bg-gray-100"
              : "border-black hover:bg-black hover:text-white"
          }`}
        >
          {isSelf
            ? "You"
            : user.is_following
            ? saving
              ? "Unfollowing…"
              : "Unfollow"
            : saving
            ? "Following…"
            : "Follow"}
        </button>
      </div>
    </div>
  );
}

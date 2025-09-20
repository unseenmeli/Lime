"use client";

import { useState } from "react";
import { songService } from "@/app/services/api";

export default function UploadSongForm() {
  const [title, setTitle] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [desc, setDesc] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!audio) {
      setMsg("Choose an audio file first!");
      return;
    }
    setMsg("Uploading…");
    try {
      const song = await songService.uploadSong({
        title,
        description: desc,
        audioFile: audio,
        coverFile: cover || undefined,
      });
      setMsg(`Uploaded: ${song.title}`);
      setTitle("");
      setAudio(null);
      setDesc("");
      setCover(null);
    } catch (e: any) {
      setMsg(e.message || "Upload failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 p-4 border rounded-lg">
      <input
        type="text"
        className="border rounded px-2 py-1"
        placeholder="Song title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <textarea
        className="border rounded px-2 py-1"
        placeholder="Description"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />

      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setAudio(e.target.files?.[0] || null)}
        required
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setCover(e.target.files?.[0] || null)}
      />

      <button
        type="submit"
        className="border px-3 py-1 rounded hover:bg-black hover:text-white"
      >
        Post
      </button>

      {msg && <div className="text-sm">{msg}</div>}
    </form>
  );
}

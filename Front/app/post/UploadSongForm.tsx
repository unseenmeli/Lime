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
    <div className="min-h-screen flex flex-col items-center py-20">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <img
              src="/bubbles.png"
              alt="Bubbles"
              className="w-100 h-auto opacity-100 translate-x-100 absolute -z-10"
            />
            <img
              src="/bubbles.png"
              alt="Bubbles"
              className="w-100 h-auto opacity-100 translate-x-100 translate-y-200 rotate-180 absolute -z-10"
            />
            <img
              src="/bubbles.png"
              className="absolute -z-10 w-120 h-auto rotate-90 -translate-x-10 translate-y-120"
            />
            <h1 className="font-bold text-5xl">upload your track</h1>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 bg-white p-10 shadow-[0_0_20px_rgba(0,0,0,0.1)] rounded-2xl"
          >
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-lg">Title</label>
              <input
                type="text"
                className="border-2 border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:border-black transition-colors"
                placeholder="Enter your song title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-semibold text-lg">Description</label>
              <textarea
                className="border-2 border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:border-black transition-colors resize-none"
                placeholder="Tell us about your track"
                rows={4}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-semibold text-lg">Audio File *</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-black transition-colors">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudio(e.target.files?.[0] || null)}
                  required
                  className="hidden"
                  id="audio-upload"
                />
                <label htmlFor="audio-upload" className="cursor-pointer">
                  {audio ? (
                    <div className="text-green-600 font-semibold">
                      ✓ {audio.name}
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-semibold">
                        Drop audio file here
                      </p>
                      <p className="text-gray-500">or click to browse</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-semibold text-lg">
                Cover Image (optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-black transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCover(e.target.files?.[0] || null)}
                  className="hidden"
                  id="cover-upload"
                />
                <label htmlFor="cover-upload" className="cursor-pointer">
                  {cover ? (
                    <div className="text-green-600 font-semibold">
                      ✓ {cover.name}
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-semibold">
                        Drop cover image here
                      </p>
                      <p className="text-gray-500">or click to browse</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="bg-black text-white px-8 py-3 rounded-lg text-lg font-semibold hover:opacity-80 active:opacity-60 transition-opacity duration-200"
              >
                Upload Track
              </button>

              {msg && (
                <div
                  className={`flex items-center px-4 ${
                    msg.includes("failed")
                      ? "text-red-600"
                      : msg.includes("Uploading")
                      ? "text-gray-600"
                      : "text-green-600"
                  } font-semibold`}
                >
                  {msg}
                </div>
              )}
            </div>
          </form>

          <div className="text-center text-gray-500 text-sm">
            <p>Supported formats: MP3, WAV, FLAC, AAC</p>
            <p>Maximum file size: 50MB</p>
          </div>
        </div>
      </div>
    </div>
  );
}

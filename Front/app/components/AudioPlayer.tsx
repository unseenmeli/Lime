"use client";

import { useState, useRef, useEffect } from "react"; // CHANGED: removed unused useMemo
import { songService } from "../services/api";

type Track = {
  id: number;
  title: string;
  artist: string;
  url: string;
  cover: string | null;
};

export default function AudioPlayer() {
  const [tracks, setTracks] = useState<Track[]>([]); // NEW

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [progress, setProgress] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = tracks[currentTrackIndex] || {
    id: 0,
    title: "Loading…",
    artist: "",
    url: "",
  };

  useEffect(() => {
    // NEW
    let cancelled = false;
    (async () => {
      try {
        const songs = await songService.listSongs(); // GET /songs/
        if (cancelled) return;
        const mapped: Track[] = songs.map((s: any) => ({
          id: s.id,
          title: s.title,
          artist: s.owner?.username ?? "Unknown",
          url: s.audio,
          cover: s.cover,
        }));
        setTracks(mapped);
        setCurrentTrackIndex(0);
      } catch (e) {
        console.error("Failed to load songs:", e);
        setTracks([]); // keep empty; UI stays same
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onExternalPlay(e: Event) {
      const custom = e as CustomEvent<{
        queue: {
          id: number;
          title: string;
          artist: string;
          url: string;
          cover?: string | null;
        }[];
        startId?: number;
      }>;
      const detail = custom.detail;
      if (!detail || !Array.isArray(detail.queue) || detail.queue.length === 0)
        return;

      const newQueue = detail.queue;
      const idx = detail.startId
        ? newQueue.findIndex((t) => t.id === detail.startId)
        : 0;

      const normalized: Track[] = newQueue.map((t) => ({
        ...t,
        cover: t.cover ?? null,
      }));
      setTracks(normalized);

      setCurrentTrackIndex(idx >= 0 ? idx : 0);
      setIsPlaying(true);

      // start playback after state updates
      setTimeout(() => {
        audioRef.current?.play().catch(() => {});
      }, 0);
    }

    window.addEventListener("player:play", onExternalPlay as EventListener);
    return () =>
      window.removeEventListener(
        "player:play",
        onExternalPlay as EventListener
      );
  }, []);

  useEffect(() => {
    const bars = 65;
    const data: number[] = [];
    for (let i = 0; i < bars; i++) {
      data.push(Math.random() * 0.7 + 0.3);
    }
    setWaveformData(data);
  }, [currentTrackIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
        setProgress(audio.currentTime / audio.duration);
      }
    };

    const setAudioDuration = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener("timeupdate", setAudioData);
    audio.addEventListener("loadedmetadata", setAudioDuration);
    audio.addEventListener("canplay", setAudioDuration);
    audio.volume = volume;

    return () => {
      audio.removeEventListener("timeupdate", setAudioData);
      audio.removeEventListener("loadedmetadata", setAudioDuration);
      audio.removeEventListener("canplay", setAudioDuration);
    };
  }, [currentTrackIndex, volume]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {}); // CHANGED: guard play promise
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const nextTrack = () => {
    if (tracks.length === 0) return; // NEW: avoid modulo 0
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play().catch(() => {}); // CHANGED: guard play
    }, 100);
  };

  const previousTrack = () => {
    if (tracks.length === 0) return; // NEW: avoid modulo 0
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play().catch(() => {}); // CHANGED: guard play
    }, 100);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center w-full h-full px-4">
      <audio
        ref={audioRef}
        src={currentTrack?.url || undefined}
        onEnded={nextTrack}
      />

      <div className="flex items-center gap-2">
        <button
          onClick={previousTrack}
          className="text-black hover:text-gray-500 transition-colors text-lg px-2"
        >
          ◄
        </button>

        <button
          onClick={togglePlayPause}
          className="px-3 py-1 text-black hover:text-gray-500 transition-colors text-lg"
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>

        <button
          onClick={nextTrack}
          className="text-black hover:text-gray-500 transition-colors text-lg px-2"
        >
          ►
        </button>
      </div>

      <div className="flex-1 mx-8">
        <div className="relative">
          <div className="text-sm mb-2">
            <span className="text-black">{currentTrack.title}</span>
            <span className="text-gray-400 mx-2">-</span>
            <span className="text-gray-600">{currentTrack.artist}</span>
          </div>

          <div className="relative h-8">
            <div className="flex items-center h-full gap-[1px] pointer-events-none">
              {waveformData.map((height, index) => {
                const barPosition = index / waveformData.length;
                const isPlayed = barPosition < progress;
                return (
                  <div
                    key={index}
                    className="flex-1 transition-colors"
                    style={{
                      height: `${height * 100}%`,
                      backgroundColor: isPlayed ? "#374151" : "#9CA3AF",
                    }}
                  />
                );
              })}
            </div>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleProgressChange}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs text-gray-400">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
      {currentTrack?.cover ? (
        <img
          src={currentTrack.cover}
          alt={`${currentTrack.title} cover`}
          className="w-14 h-14 rounded mr-4 object-cover"
        />
      ) : (
        <div className="w-14 h-14 rounded mr-4 bg-gray-200 flex items-center justify-center text-gray-500">
          ♪
        </div>
      )}

      <div className="relative flex items-center">
        <button
          className="text-sm text-black hover:text-gray-500 transition-colors px-3"
          onClick={() => setShowVolumeSlider(!showVolumeSlider)}
        >
          volume
        </button>

        {showVolumeSlider && (
          <div
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 bg-white border border-gray-200 p-3 rounded-md shadow-lg"
            style={{ width: "120px" }}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] text-gray-500">
                {Math.round(volume * 100)}%
              </span>
              <div className="relative w-full py-2">
                <div className="relative h-1">
                  <div className="absolute inset-0 bg-gray-200 rounded-full" />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${volume * 100}%`,
                      background: "linear-gradient(to right, #C3D772, #a3c054)",
                      transition: "none",
                    }}
                  />
                  <div
                    className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-gray-400 rounded-full shadow-sm hover:border-gray-500 pointer-events-none"
                    style={{
                      left: `${volume * 100}%`,
                      transition: "none",
                    }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

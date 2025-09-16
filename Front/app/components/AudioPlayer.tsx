"use client";

import { useState, useRef, useEffect } from "react";

interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
}

const tracks: Track[] = [
  {
    id: 1,
    title: "Strangers",
    artist: "Unknown",
    url: "/strangers.mp3",
  },
];

export default function AudioPlayer() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrack = tracks[currentTrackIndex];

  useEffect(() => {
    const generateWaveform = () => {
      const bars = 65;
      const data = [];
      for (let i = 0; i < bars; i++) {
        data.push(Math.random() * 0.7 + 0.3);
      }
      setWaveformData(data);
    };
    generateWaveform();
  }, [currentTrackIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
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
      audioRef.current.play();
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
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play();
    }, 100);
  };

  const previousTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play();
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
      <audio ref={audioRef} src={currentTrack.url} onEnded={nextTrack} />

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
                const progress = duration > 0 ? currentTime / duration : 0;
                const barPosition = index / waveformData.length;
                const isPlayed = barPosition < progress;
                return (
                  <div
                    key={index}
                    className="flex-1 bg-gray-400 transition-colors"
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
                  {/* Background track */}
                  <div className="absolute inset-0 bg-gray-200 rounded-full" />
                  {/* Active track */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${volume * 100}%`,
                      background: 'linear-gradient(to right, #C3D772, #a3c054)',
                      transition: 'none'
                    }}
                  />
                  {/* Thumb */}
                  <div
                    className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-gray-400 rounded-full shadow-sm hover:border-gray-500 pointer-events-none"
                    style={{
                      left: `${volume * 100}%`,
                      transition: 'none'
                    }}
                  />
                </div>
                {/* Invisible input - covers full clickable area */}
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

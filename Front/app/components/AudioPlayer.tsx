"use client";

import { useState, useRef, useEffect } from "react"; // CHANGED: removed unused useMemo
import { songService } from "../services/api";

type Track = {
  id: number;
  title: string;
  artist: string;
  url: string;
  cover: string | null;
  waveform_data?: number[] | null;
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
  const [settingsForMusic, setSettingsForMusic] = useState(false);
  const [eqVolume, setEqVolume] = useState(70);
  const [eqBands, setEqBands] = useState<{ [key: string]: number }>({
    "60Hz": 50,
    "250Hz": 50,
    "1kHz": 50,
    "4kHz": 50,
    "8kHz": 50,
    "16kHz": 50,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [eqPosition, setEqPosition] = useState({ x: 0, y: 0 });

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
          waveform_data: s.waveform_data,
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
          waveform_data?: number[] | null;
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
        waveform_data: t.waveform_data ?? null,
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
    return () => {
      window.removeEventListener("player:play", onExternalPlay as EventListener);
    };
  }, []);
  const eqPanelRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const currentTrack = tracks[currentTrackIndex];
    if (currentTrack?.waveform_data && currentTrack.waveform_data.length > 0) {
      setWaveformData(currentTrack.waveform_data);
    } else {
      setWaveformData(Array(65).fill(0.5));
    }
  }, [currentTrackIndex, tracks]);

  // Dragging functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      setEqPosition({ x: deltaX, y: deltaY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "move";
    } else {
      document.body.style.cursor = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
  }, [isDragging]);

  const initializeAudioContext = () => {
    if (!audioRef.current || audioContextRef.current) return;

    try {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaElementSource(audioRef.current);
      sourceRef.current = source;

      const gainNode = audioContext.createGain();
      gainNodeRef.current = gainNode;
      gainNode.gain.value = volume;

      const frequencies = [60, 250, 1000, 4000, 8000, 16000];
      const filters: BiquadFilterNode[] = [];

      frequencies.forEach((freq, index) => {
        const filter = audioContext.createBiquadFilter();
        if (index === 0) {
          filter.type = "lowshelf";
        } else if (index === frequencies.length - 1) {
          filter.type = "highshelf";
        } else {
          filter.type = "peaking";
        }
        filter.frequency.value = freq;
        filter.Q.value = 1;
        filter.gain.value = 0;
        filters.push(filter);
      });

      filtersRef.current = filters;

      // Connect the audio graph
      let lastNode: AudioNode = source;
      filters.forEach((filter) => {
        lastNode.connect(filter);
        lastNode = filter;
      });
      lastNode.connect(gainNode);
      gainNode.connect(audioContext.destination);
    } catch (error) {
      console.error("Web Audio API initialization error:", error);
    }
  };

  useEffect(() => {
    if (!filtersRef.current.length) return;

    const frequencies = ["60Hz", "250Hz", "1kHz", "4kHz", "8kHz", "16kHz"];
    frequencies.forEach((freq, index) => {
      const filter = filtersRef.current[index];
      if (filter) {
        const value = eqBands[freq];
        const gain = ((value - 50) / 50) * 12;
        filter.gain.value = gain;
      }
    });
  }, [eqBands]);

  useEffect(() => {
    const volumeValue = eqVolume / 100;
    setVolume(volumeValue);
    if (audioRef.current) {
      audioRef.current.volume = volumeValue;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volumeValue;
    }
  }, [eqVolume]);

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

    const handleSeeked = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setProgress(audio.currentTime / audio.duration);
      }
    };

    audio.addEventListener("timeupdate", setAudioData);
    audio.addEventListener("loadedmetadata", setAudioDuration);
    audio.addEventListener("canplay", setAudioDuration);
    audio.addEventListener("seeked", handleSeeked);
    audio.volume = volume;

    return () => {
      audio.removeEventListener("timeupdate", setAudioData);
      audio.removeEventListener("loadedmetadata", setAudioDuration);
      audio.removeEventListener("canplay", setAudioDuration);
      audio.removeEventListener("seeked", handleSeeked);
    };
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.url) return;

    if (!audio.src || audio.src !== currentTrack.url) {
      audio.src = currentTrack.url;
      audio.load();
      setCurrentTime(0);
      setProgress(0);
      setDuration(0);
    }
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

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
    const audio = audioRef.current;

    if (audio && audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
      const clampedTime = Math.max(0, Math.min(newTime, audio.duration));
      audio.currentTime = clampedTime;
      setCurrentTime(clampedTime);
      setProgress(clampedTime / audio.duration);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setEqVolume(Math.round(newVolume * 100));
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newVolume;
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
      <audio ref={audioRef} onEnded={nextTrack} />

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
              {waveformData.length > 0 &&
                waveformData.map((height, index) => {
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
        <button
          className="text-xl opacity-90 hover:opacity-60"
          onClick={() => {
            setSettingsForMusic(true);
            initializeAudioContext();
          }}
        >
          ⚙
        </button>

        {settingsForMusic && (
          <div
            ref={eqPanelRef}
            className="fixed bg-white border-2 border-gray-300 p-6 shadow-lg z-150 overflow-hidden"
            style={{
              width: "420px",
              left: `calc(50% + ${eqPosition.x}px)`,
              top: `calc(50% + ${eqPosition.y}px)`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <img
              src="/eq_background.png"
              className="absolute inset-0 w-180 h-80 object-cover opacity-30 scale-150 -z-10"
              alt=""
            />
            <div className="flex flex-col gap-4 relative z-10">
              <div
                className="border-b-2 border-gray-300 pb-3 flex items-center justify-between cursor-move"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                  dragStartRef.current = {
                    x: e.clientX - eqPosition.x,
                    y: e.clientY - eqPosition.y,
                  };
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={previousTrack}
                      className="text-black hover:text-gray-500 transition-colors text-lg"
                    >
                      ◄
                    </button>
                    <button
                      onClick={togglePlayPause}
                      className="px-2 text-black hover:text-gray-500 transition-colors text-lg"
                    >
                      {isPlaying ? "❚❚" : "▶"}
                    </button>
                    <button
                      onClick={nextTrack}
                      className="text-black hover:text-gray-500 transition-colors text-lg"
                    >
                      ►
                    </button>
                  </div>
                  <div className="select-none">
                    <p className="font-bold text-lg">equalizer</p>
                    <p className="text-xs text-gray-600">
                      {currentTrack.title}
                    </p>
                  </div>
                </div>
                <button
                  className="text-2xl hover:opacity-50 transition-opacity"
                  onClick={() => setSettingsForMusic(false)}
                >
                  ×
                </button>
              </div>

              <div className="flex gap-6">
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs font-bold">volume</p>
                  <div className="h-32 w-8 relative flex items-center justify-center">
                    <div className="absolute h-full w-2 bg-gray-200"></div>
                    <div
                      className="absolute h-full w-full cursor-pointer"
                      onMouseDown={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const updateValue = (clientY: number) => {
                          const y = clientY - rect.top;
                          const percentage = 100 - (y / rect.height) * 100;
                          setEqVolume(
                            Math.max(0, Math.min(100, Math.round(percentage)))
                          );
                        };
                        updateValue(e.clientY);
                        const handleMouseMove = (e: MouseEvent) =>
                          updateValue(e.clientY);
                        const handleMouseUp = () => {
                          document.removeEventListener(
                            "mousemove",
                            handleMouseMove
                          );
                          document.removeEventListener(
                            "mouseup",
                            handleMouseUp
                          );
                        };
                        document.addEventListener("mousemove", handleMouseMove);
                        document.addEventListener("mouseup", handleMouseUp);
                      }}
                    ></div>
                    <div
                      className="absolute w-4 h-1 bg-black pointer-events-none"
                      style={{ top: `${100 - eqVolume}%` }}
                    ></div>
                  </div>
                  <p className="text-xs">{eqVolume}%</p>
                </div>

                <div className="flex-1 flex justify-around">
                  {Object.entries(eqBands).map(([freq, value]) => (
                    <div
                      key={freq}
                      className="flex flex-col items-center gap-2"
                    >
                      <p className="text-xs">{freq}</p>
                      <div className="h-32 w-8 relative flex items-center justify-center">
                        <div className="absolute h-full w-2 bg-gray-200"></div>
                        <div
                          className="absolute h-full w-full cursor-pointer"
                          onMouseDown={(e) => {
                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            const updateValue = (clientY: number) => {
                              const y = clientY - rect.top;
                              const percentage = 100 - (y / rect.height) * 100;
                              const newValue = Math.max(
                                0,
                                Math.min(100, Math.round(percentage))
                              );
                              setEqBands((prev) => ({
                                ...prev,
                                [freq]: newValue,
                              }));
                            };
                            updateValue(e.clientY);
                            const handleMouseMove = (e: MouseEvent) =>
                              updateValue(e.clientY);
                            const handleMouseUp = () => {
                              document.removeEventListener(
                                "mousemove",
                                handleMouseMove
                              );
                              document.removeEventListener(
                                "mouseup",
                                handleMouseUp
                              );
                            };
                            document.addEventListener(
                              "mousemove",
                              handleMouseMove
                            );
                            document.addEventListener("mouseup", handleMouseUp);
                          }}
                        ></div>
                        <div
                          className="absolute w-4 h-1 bg-black pointer-events-none"
                          style={{ top: `${100 - value}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600">
                        {Math.round((value - 50) * 0.24)}dB
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                <div className="flex gap-3">
                  <button className="text-sm hover:opacity-50 transition-opacity">
                    presets
                  </button>
                  <button
                    className="text-sm hover:opacity-50 transition-opacity"
                    onClick={() => {
                      setEqVolume(70);
                      setEqBands({
                        "60Hz": 50,
                        "250Hz": 50,
                        "1kHz": 50,
                        "4kHz": 50,
                        "8kHz": 50,
                        "16kHz": 50,
                      });
                    }}
                  >
                    reset
                  </button>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" defaultChecked />
                  <span className="text-sm">enabled</span>
                </label>
              </div>
            </div>
          </div>
        )}

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

"use client";

import { useState, useCallback } from "react";
import YouTube, { type YouTubeProps } from "react-youtube";
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle, ExternalLink } from "lucide-react";
import { YOUTUBE_URL_PATTERNS, YOUTUBE_ERROR_MESSAGES } from "~/utils/constants";

interface YouTubePlayerProps {
  youtubeUrl: string;
  videoTitle?: string;
}

export function YouTubePlayer({ youtubeUrl, videoTitle }: YouTubePlayerProps) {
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extract video ID from YouTube URL
  const getVideoId = (url: string): string | null => {
    const match = YOUTUBE_URL_PATTERNS.find(pattern => pattern.test(url))?.exec(url);
    return match?.[1] || null;
  };

  const videoId = getVideoId(youtubeUrl);

  const onReady: YouTubeProps["onReady"] = useCallback((event: any) => {
    setPlayer(event.target);
    setIsLoading(false);
    setError(null);
  }, []);

  const onPlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const onPause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const onError: YouTubeProps["onError"] = useCallback((event: any) => {
    setIsLoading(false);
    setError(YOUTUBE_ERROR_MESSAGES[event.data as keyof typeof YOUTUBE_ERROR_MESSAGES] || "Nie udało się załadować wideo");
  }, []);

  const togglePlayPause = () => {
    if (!player) return;

    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const toggleMute = () => {
    if (!player) return;

    if (isMuted) {
      player.unMute();
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };

  const openFullscreen = () => {
    if (!player) return;
    const iframe = player.getIframe();
    if (iframe.requestFullscreen) {
      iframe.requestFullscreen();
    }
  };

  if (!videoId) {
    return (
      <div className="w-full bg-gradient-to-r from-red-50/90 to-rose-50/90 dark:from-red-950/40 dark:to-rose-950/40 border border-red-200/60 dark:border-red-800/60 rounded-xl p-6 backdrop-blur-sm shadow-lg shadow-red-200/20 dark:shadow-red-900/20 animate-in fade-in-0 duration-300">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100/70 dark:bg-red-900/30">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
              Nieprawidłowy URL YouTube
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
              Podaj prawidłowy URL wideo z YouTube.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-gradient-to-r from-red-50/90 to-rose-50/90 dark:from-red-950/40 dark:to-rose-950/40 border border-red-200/60 dark:border-red-800/60 rounded-xl p-6 backdrop-blur-sm shadow-lg shadow-red-200/20 dark:shadow-red-900/20 animate-in fade-in-0 duration-300">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100/70 dark:bg-red-900/30">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
              Błąd wideo
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const opts: YouTubeProps["opts"] = {
    height: "400",
    width: "100%",
    playerVars: {
      autoplay: 0,
      controls: 1,
      disablekb: 0,
      enablejsapi: 1,
      fs: 1,
      iv_load_policy: 3,
      modestbranding: 1,
      playsinline: 1,
      rel: 0,
    },
  };

  return (
    <div className="w-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden animate-in fade-in-0 duration-500">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-slate-50/50 to-slate-100/50 dark:from-slate-700/30 dark:to-slate-600/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40">
            <Play className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
            {videoTitle || "Film YouTube"}
          </h3>
        </div>
      </div>

      {/* Video Player */}
      <div className="relative bg-slate-900">
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100/90 to-slate-200/90 dark:from-slate-700/90 dark:to-slate-800/90 backdrop-blur-sm flex items-center justify-center z-10 animate-in fade-in-0 duration-300">
            <div className="flex flex-col items-center space-y-4 text-slate-700 dark:text-slate-300">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              </div>
              <div className="text-center">
                <p className="font-semibold">Ładowanie wideo...</p>
                <p className="text-sm opacity-75 mt-1">Przygotowywanie odtwarzacza</p>
              </div>
            </div>
          </div>
        )}

        <div className="aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden">
          <YouTube
            videoId={videoId}
            opts={opts}
            onReady={onReady}
            onPlay={onPlay}
            onPause={onPause}
            onError={onError}
            className="w-full h-full rounded-lg"
          />
        </div>

        {/* Enhanced Custom Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-1">
              <button
                onClick={togglePlayPause}
                className="p-2.5 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-sm border border-white/10 shadow-lg"
                disabled={!player}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </button>

              <button
                onClick={toggleMute}
                className="p-2.5 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-sm border border-white/10 shadow-lg"
                disabled={!player}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={openFullscreen}
                className="p-2.5 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-sm border border-white/10 shadow-lg"
                disabled={!player}
              >
                <Maximize className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <div className="p-4 bg-gradient-to-r from-slate-50/70 to-slate-100/70 dark:from-slate-700/50 dark:to-slate-600/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Odtwarzacz YouTube</span>
          </div>
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:scale-105 active:scale-95 px-2 py-1 rounded-lg hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
          >
            <span>Otwórz w YouTube</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
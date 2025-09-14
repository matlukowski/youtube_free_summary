"use client";

import { useState, useCallback } from "react";
import YouTube, { type YouTubeProps } from "react-youtube";
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle } from "lucide-react";
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
      <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Nieprawidłowy URL YouTube
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">
              Podaj prawidłowy URL wideo z YouTube.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Błąd wideo
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">
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
    <div className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
          {videoTitle || "Film YouTube"}
        </h3>
      </div>

      {/* Video Player */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Ładowanie wideo...</span>
            </div>
          </div>
        )}

        <div className="aspect-video bg-black">
          <YouTube
            videoId={videoId}
            opts={opts}
            onReady={onReady}
            onPlay={onPlay}
            onPause={onPause}
            onError={onError}
            className="w-full h-full"
          />
        </div>

        {/* Custom Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <button
                onClick={togglePlayPause}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                disabled={!player}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </button>

              <button
                onClick={toggleMute}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                disabled={!player}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>
            </div>

            <button
              onClick={openFullscreen}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              disabled={!player}
            >
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Odtwarzacz YouTube</span>
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Otwórz w YouTube
          </a>
        </div>
      </div>
    </div>
  );
}
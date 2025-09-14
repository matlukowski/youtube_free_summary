"use client";

import { useState } from "react";
import { Download, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { LoadingSpinner } from "./LoadingSpinner";
import { api } from "~/trpc/react";
import { YOUTUBE_REGEX } from "~/utils/constants";
import type { TranscriptData } from "~/types/transcript";

interface TranscriptFormProps {
  onTranscriptFetched: (transcript: TranscriptData) => void;
}

export function TranscriptForm({ onTranscriptFetched }: TranscriptFormProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const fetchTranscriptMutation = api.transcript.fetchTranscript.useMutation({
    onSuccess: (data) => {
      onTranscriptFetched(data);
      setUrl("");
      setError("");
      toast.success("Napisy pobrane pomyślnie!");
    },
    onError: (error) => {
      setError(error.message);
      toast.error(error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("Wprowadź URL YouTube");
      return;
    }

    if (!YOUTUBE_REGEX.test(trimmedUrl)) {
      setError("Wprowadź prawidłowy URL YouTube");
      return;
    }

    fetchTranscriptMutation.mutate({ youtubeUrl: trimmedUrl });
  };

  const isLoading = fetchTranscriptMutation.isPending;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="youtube-url" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            URL YouTube
          </label>
          <div className="relative">
            <input
              id="youtube-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={isLoading}
            />
            <Download className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="text-white" />
              <span>Pobieranie napisów...</span>
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              <span>Pobierz napisy</span>
            </>
          )}
        </button>
      </form>

      {isLoading && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center space-x-3">
            <LoadingSpinner className="text-blue-600" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium">Pobieranie napisów...</p>
              <p className="text-blue-600 dark:text-blue-400">Może to potrwać kilka sekund w zależności od długości filmu.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
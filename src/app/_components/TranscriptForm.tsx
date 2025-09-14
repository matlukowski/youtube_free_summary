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
          <label htmlFor="youtube-url" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            URL YouTube
          </label>
          <div className="relative group">
            <input
              id="youtube-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-xl bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-transparent transition-all duration-200 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500"
              disabled={isLoading}
            />
            <Download className="absolute right-3 top-3.5 h-5 w-5 text-slate-400 group-hover:text-slate-500 transition-colors duration-200" />
          </div>
        </div>

        {error && (
          <div className="flex items-center space-x-3 text-red-700 dark:text-red-300 bg-gradient-to-r from-red-50 to-red-50/80 dark:from-red-950/40 dark:to-red-900/30 border border-red-200/60 dark:border-red-800/60 rounded-xl p-4 backdrop-blur-sm animate-in fade-in-0 duration-300">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 dark:text-red-400" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3 sm:py-3 px-4 min-h-[48px] rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-700/30 hover:scale-[1.02] disabled:hover:scale-100 transition-all duration-200 active:scale-[0.98] touch-manipulation"
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
        <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/60 dark:border-blue-800/60 rounded-xl backdrop-blur-sm animate-in fade-in-0 duration-500">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="flex-shrink-0">
              <LoadingSpinner className="text-blue-600" size="md" />
            </div>
            <div className="text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-200 mb-1">Pobieranie napisów...</p>
              <p className="text-blue-700 dark:text-blue-300 leading-relaxed">Może to potrwać kilka sekund w zależności od długości filmu.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
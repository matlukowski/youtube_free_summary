"use client";

import { useState } from "react";
import { Clock, ExternalLink, Trash2, Search, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { LoadingSpinnerFull } from "./LoadingSpinner";
import { api } from "~/trpc/react";
import type { TranscriptSummary } from "~/types/transcript";

interface TranscriptHistoryProps {
  onSelectTranscript: (transcript: TranscriptSummary) => void;
}

export function TranscriptHistory({ onSelectTranscript }: TranscriptHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    data: historyData,
    isLoading,
    refetch,
  } = api.transcript.getHistory.useQuery(
    { limit: 50, offset: 0 },
    { refetchOnWindowFocus: false }
  );

  const deleteTranscriptMutation = api.transcript.delete.useMutation({
    onSuccess: () => {
      toast.success("Transkrypt został pomyślnie usunięty");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Czy na pewno chcesz usunąć ten transkrypt?")) {
      deleteTranscriptMutation.mutate({ id });
    }
  };

  const handleOpenVideo = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const filteredTranscripts = historyData?.transcripts.filter((transcript) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      transcript.videoTitle?.toLowerCase().includes(searchLower) ||
      transcript.youtubeUrl.toLowerCase().includes(searchLower)
    );
  }) || [];

  if (isLoading) {
    return (
      <div className="w-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50">
        <LoadingSpinnerFull message="Ładowanie historii..." />
      </div>
    );
  }

  return (
    <div className="w-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Ostatnie transkrypty
            </h3>
            {historyData && (
              <span className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                {historyData.total}
              </span>
            )}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="sm:hidden flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100/70 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-600 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                <span className="font-medium">Ukryj</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span className="font-medium">Pokaż</span>
              </>
            )}
          </button>
        </div>

        {/* Search */}
        <div className={`relative group ${!isExpanded ? "hidden sm:block" : ""}`}>
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-hover:text-slate-500 transition-colors duration-200" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Szukaj transkryptów..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50/70 dark:bg-slate-700/70 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:border-transparent hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
          />
        </div>
      </div>

      {/* Content */}
      <div className={`${!isExpanded ? "hidden sm:block" : ""}`}>
        {filteredTranscripts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 mb-4">
              <Clock className="h-7 w-7 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              {searchTerm
                ? "Brak transkryptów pasujących do wyszukiwania"
                : "Brak transkryptów. Pobierz pierwszy transkrypt, aby zacząć!"}
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {filteredTranscripts.map((transcript) => (
              <div
                key={transcript.id}
                onClick={() => onSelectTranscript(transcript)}
                className="p-4 border-b border-slate-100/60 dark:border-slate-700/60 hover:bg-slate-50/70 dark:hover:bg-slate-700/50 cursor-pointer transition-all duration-200 group hover:shadow-sm hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                      {transcript.videoTitle || "Film bez tytułu"}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2">
                      <span className="font-medium">{format(new Date(transcript.createdAt), "MMM d, h:mm a")}</span>
                      {transcript.language && (
                        <span className="bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-full text-xs font-medium">
                          {transcript.language.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                      {new URL(transcript.youtubeUrl).hostname}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={(e) => handleOpenVideo(transcript.youtubeUrl, e)}
                      className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                      title="Otwórz film"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>

                    <button
                      onClick={(e) => handleDelete(transcript.id, e)}
                      className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Usuń transkrypt"
                      disabled={deleteTranscriptMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {historyData?.hasMore && (
          <div className="p-4 border-t border-slate-200/60 dark:border-slate-700/60">
            <button className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/40 py-3 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
              Załaduj więcej transkryptów
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
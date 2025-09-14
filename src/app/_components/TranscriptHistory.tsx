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
      <div className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <LoadingSpinnerFull message="Ładowanie historii..." />
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Ostatnie transkrypty
            </h3>
            {historyData && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({historyData.total})
              </span>
            )}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="sm:hidden flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Ukryj
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Pokaż
              </>
            )}
          </button>
        </div>

        {/* Search */}
        <div className={`relative ${!isExpanded ? "hidden sm:block" : ""}`}>
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Szukaj transkryptów..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className={`${!isExpanded ? "hidden sm:block" : ""}`}>
        {filteredTranscripts.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
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
                className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
                      {transcript.videoTitle || "Film bez tytułu"}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span>{format(new Date(transcript.createdAt), "MMM d, h:mm a")}</span>
                      {transcript.language && (
                        <span className="bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded">
                          {transcript.language.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {new URL(transcript.youtubeUrl).hostname}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleOpenVideo(transcript.youtubeUrl, e)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Otwórz film"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>

                    <button
                      onClick={(e) => handleDelete(transcript.id, e)}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              Załaduj więcej transkryptów
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
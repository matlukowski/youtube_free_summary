"use client";

import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { Youtube, FileText, AlertTriangle, Home } from "lucide-react";
import { TranscriptForm } from "~/app/_components/TranscriptForm";
import { TranscriptTabs } from "~/app/_components/TranscriptTabs";
import { YouTubePlayer } from "~/app/_components/YouTubePlayer";
import { LanguageSwitcher } from "~/app/_components/LanguageSwitcher";
import { TranscriptHistory } from "~/app/_components/TranscriptHistory";
import { api } from "~/trpc/react";
import type { TranscriptData, TranscriptSummary } from "~/types/transcript";

export default function HomePage() {
  const [currentTranscript, setCurrentTranscript] = useState<TranscriptData | null>(null);
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "pl">("pl");

  const { data: ytDlpCheck } = api.transcript.checkYtDlp.useQuery();

  // Fetch full transcript when an ID is selected
  const { data: fullTranscript } = api.transcript.getById.useQuery(
    { id: selectedTranscriptId! },
    { enabled: !!selectedTranscriptId }
  );

  // Update current transcript when full transcript is loaded
  useEffect(() => {
    if (fullTranscript) {
      setCurrentTranscript(fullTranscript);
      setSelectedTranscriptId(null); // Reset selection
    }
  }, [fullTranscript]);

  const handleTranscriptFetched = (transcript: TranscriptData) => {
    setCurrentTranscript(transcript);
  };

  const handleSelectTranscript = (transcriptSummary: TranscriptSummary) => {
    setSelectedTranscriptId(transcriptSummary.id);
  };

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        {/* Header */}
        <header className="backdrop-blur-sm bg-white/90 dark:bg-slate-800/90 border-b border-slate-200/60 dark:border-slate-700/60 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100/70 dark:bg-slate-700/70 hover:bg-slate-200/80 dark:hover:bg-slate-600/80 border border-slate-200/50 dark:border-slate-600/50 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] touch-manipulation group"
                  title="Strona główna"
                >
                  <Home className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors duration-200" />
                </button>

                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Youtube className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent truncate">
                      YouTube Free Summary
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm hidden sm:block">
                      Darmowe podsumowania filmów YouTube za pomocą lokalnego AI
                    </p>
                  </div>
                </div>
              </div>
              <LanguageSwitcher
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
              />
            </div>
          </div>
        </header>

        {/* yt-dlp Warning */}
        {ytDlpCheck && !ytDlpCheck.isAvailable && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40 border-b border-amber-200/60 dark:border-amber-800/60 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Nie wykryto yt-dlp
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Zainstaluj yt-dlp aby pobierać napisy. Zobacz README z instrukcjami instalacji.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left Column - Form and Transcript */}
            <div className="lg:col-span-8 space-y-6 lg:space-y-8">
              {/* Form */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Wklej link do filmu YouTube
                </h2>
                <TranscriptForm onTranscriptFetched={handleTranscriptFetched} />
              </div>

              {/* YouTube Player */}
              {currentTranscript && (
                <YouTubePlayer
                  youtubeUrl={currentTranscript.youtubeUrl}
                  videoTitle={currentTranscript.videoTitle || undefined}
                />
              )}

              {/* Current Transcript */}
              {currentTranscript && (
                <TranscriptTabs
                  transcript={currentTranscript}
                  selectedLanguage={selectedLanguage}
                />
              )}

              {/* Placeholder when no transcript */}
              {!currentTranscript && (
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-8 sm:p-12 shadow-lg shadow-slate-200/30 dark:shadow-slate-900/30">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 mb-4 sm:mb-6">
                      <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2 sm:mb-3">
                      Gotowy na podsumowanie?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-sm sm:max-w-md mx-auto leading-relaxed text-sm sm:text-base">
                      Wklej link do filmu YouTube powyżej, aby otrzymać darmowe podsumowanie za pomocą AI
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - History */}
            <div className="lg:col-span-4">
              <TranscriptHistory onSelectTranscript={handleSelectTranscript} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border-t border-slate-200/60 dark:border-slate-700/60 mt-12 sm:mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <p>
                Zbudowane przy użyciu{" "}
                <a
                  href="https://create.t3.gg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 hover:underline"
                >
                  T3 Stack
                </a>,{" "}
                <a
                  href="https://github.com/yt-dlp/yt-dlp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 hover:underline"
                >
                  yt-dlp
                </a>{" "}
                i{" "}
                <a
                  href="https://ollama.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 hover:underline"
                >
                  Ollama
                </a>
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* Toast Notifications */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          className: "!text-sm",
          style: {
            background: "#363636",
            color: "#fff",
            minHeight: "48px",
            padding: "12px 16px",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#4ade80",
              secondary: "#fff",
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: "#f87171",
              secondary: "#fff",
            },
          },
        }}
      />
    </>
  );
}

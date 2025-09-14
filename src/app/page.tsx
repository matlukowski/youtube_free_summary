"use client";

import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { Youtube, FileText, AlertTriangle } from "lucide-react";
import { TranscriptForm } from "~/app/_components/TranscriptForm";
import { TranscriptTabs } from "~/app/_components/TranscriptTabs";
import { YouTubePlayer } from "~/app/_components/YouTubePlayer";
import { LanguageSwitcher } from "~/app/_components/LanguageSwitcher";
import { TranscriptHistory } from "~/app/_components/TranscriptHistory";
import { api } from "~/trpc/react";
import type { TranscriptData, TranscriptSummary } from "~/types/transcript";

export default function Home() {
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
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Youtube className="h-8 w-8 text-red-600" />
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Pobieranie Napisów z YouTube z AI
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Pobieraj napisy z filmów YouTube i analizuj je za pomocą lokalnego AI
                  </p>
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
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Nie wykryto yt-dlp
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Zainstaluj yt-dlp aby pobierać napisy. Zobacz README z instrukcjami instalacji.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Form and Transcript */}
            <div className="lg:col-span-8 space-y-8">
              {/* Form */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Pobierz napisy z YouTube
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
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Brak załadowanego transkryptu
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Wprowadź URL YouTube powyżej, aby pobrać i wyświetlić napisy z funkcjami AI
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
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>
                Zbudowane przy użyciu{" "}
                <a
                  href="https://create.t3.gg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  T3 Stack
                </a>,{" "}
                <a
                  href="https://github.com/yt-dlp/yt-dlp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  yt-dlp
                </a>{" "}
                i{" "}
                <a
                  href="https://ollama.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
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
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
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

"use client";

import { useState, useMemo, useCallback } from "react";
import { FileText, Sparkles, RefreshCw, AlertCircle, type LucideIcon } from "lucide-react";
import toast from "react-hot-toast";
import { TranscriptDisplay } from "./TranscriptDisplay";
import { LoadingSpinner } from "./LoadingSpinner";
import { api } from "~/trpc/react";
import type { TranscriptData, SupportedLanguage, TabType, SummaryStyle } from "~/types/transcript";

interface TranscriptTabsProps {
  transcript: TranscriptData;
  selectedLanguage: SupportedLanguage;
}

interface TabConfig {
  id: TabType;
  nameKey: keyof typeof TRANSLATIONS;
  icon: LucideIcon;
  count?: number | null;
}

const TRANSLATIONS = {
  fullTranscript: { pl: "Pełny transkrypt", en: "Full Transcript" },
  aiSummary: { pl: "Podsumowanie AI", en: "AI Summary" },
  words: { pl: "słów", en: "words" },
  ollamaUnavailable: { pl: "Ollama niedostępne", en: "Ollama not available" },
  ollamaInstructions: {
    pl: "Uruchom Ollama aby generować podsumowania AI. Zobacz README dla instrukcji instalacji.",
    en: "Please start Ollama to generate AI summaries. See README for installation instructions."
  },
  noSummaryYet: { pl: "Nie ma jeszcze podsumowania", en: "No summary yet" },
  generateSummaryDescription: {
    pl: "Wygeneruj podsumowanie AI tego transkryptu używając lokalnego modelu.",
    en: "Generate an AI summary of this transcript using a local model."
  },
  concise: { pl: "Zwięzłe", en: "Concise" },
  detailed: { pl: "Szczegółowe", en: "Detailed" },
  bulletPoints: { pl: "Punkty", en: "Bullet Points" },
  generatingSummary: { pl: "Generowanie podsumowania...", en: "Generating summary..." },
  generatingDescription: {
    pl: "To może potrwać kilka sekund w zależności od długości transkryptu.",
    en: "This may take a few seconds depending on the transcript length."
  },
  regenerate: { pl: "Regeneruj", en: "Regenerate" },
  model: { pl: "Model", en: "Model" },
  generated: { pl: "Wygenerowane", en: "Generated" },
  summaryGenerated: { pl: "Podsumowanie wygenerowane!", en: "Summary generated!" },
  summaryDeleted: { pl: "Podsumowanie usunięte", en: "Summary deleted" }
} as const;


const SUMMARY_BUTTON_CONFIGS = [
  { style: "concise" as SummaryStyle, colorClass: "bg-blue-600 hover:bg-blue-700", textKey: "concise" as keyof typeof TRANSLATIONS },
  { style: "detailed" as SummaryStyle, colorClass: "bg-green-600 hover:bg-green-700", textKey: "detailed" as keyof typeof TRANSLATIONS },
  { style: "bullet-points" as SummaryStyle, colorClass: "bg-purple-600 hover:bg-purple-700", textKey: "bulletPoints" as keyof typeof TRANSLATIONS }
] as const;

function useTranslation(selectedLanguage: SupportedLanguage) {
  return useCallback((key: keyof typeof TRANSLATIONS) => {
    return TRANSLATIONS[key][selectedLanguage];
  }, [selectedLanguage]);
}

function useSummaryMutations(transcript: TranscriptData, selectedLanguage: SupportedLanguage, refetchSummary: () => void) {
  const t = useTranslation(selectedLanguage);

  const generateSummaryMutation = api.transcript.generateSummary.useMutation({
    onSuccess: () => {
      refetchSummary();
      toast.success(t("summaryGenerated"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteSummaryMutation = api.transcript.deleteSummary.useMutation({
    onSuccess: () => {
      refetchSummary();
      toast.success(t("summaryDeleted"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleGenerateSummary = useCallback((style: SummaryStyle = "concise") => {
    generateSummaryMutation.mutate({
      transcriptId: transcript.id,
      language: selectedLanguage,
      style,
      maxLength: 500,
    });
  }, [generateSummaryMutation, transcript.id, selectedLanguage]);

  const handleRegenerateSummary = useCallback((summary: { id: string } | null) => {
    if (summary) {
      deleteSummaryMutation.mutate({ transcriptId: transcript.id });
    }
    setTimeout(() => {
      handleGenerateSummary();
    }, 500);
  }, [deleteSummaryMutation, transcript.id, handleGenerateSummary]);

  return {
    generateSummaryMutation,
    deleteSummaryMutation,
    handleGenerateSummary,
    handleRegenerateSummary
  };
}

interface SummaryButtonProps {
  config: typeof SUMMARY_BUTTON_CONFIGS[number];
  onClick: (style: SummaryStyle) => void;
  disabled: boolean;
  selectedLanguage: SupportedLanguage;
}

function SummaryButton({ config, onClick, disabled, selectedLanguage }: SummaryButtonProps) {
  const t = useTranslation(selectedLanguage);

  return (
    <button
      onClick={() => onClick(config.style)}
      disabled={disabled}
      className={`px-4 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${config.colorClass}`}
    >
      {t(config.textKey)}
    </button>
  );
}

function countWords(text: string): number {
  return text.split(/\s+/).length;
}

export function TranscriptTabs({ transcript, selectedLanguage }: TranscriptTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("transcript");
  const t = useTranslation(selectedLanguage);

  const { data: summary, refetch: refetchSummary } = api.transcript.getSummary.useQuery(
    { transcriptId: transcript.id },
    {
      enabled: activeTab === "summary",
      refetchOnWindowFocus: false
    }
  );

  const { data: ollamaCheck } = api.transcript.checkOllama.useQuery();

  const {
    generateSummaryMutation,
    deleteSummaryMutation,
    handleGenerateSummary,
    handleRegenerateSummary
  } = useSummaryMutations(transcript, selectedLanguage, refetchSummary);

  const transcriptWordCount = useMemo(() => countWords(transcript.transcript), [transcript.transcript]);
  const summaryWordCount = useMemo(() => summary ? countWords(summary.summary) : null, [summary]);

  const tabs = useMemo((): TabConfig[] => [
    {
      id: "transcript",
      nameKey: "fullTranscript",
      icon: FileText,
      count: transcriptWordCount,
    },
    {
      id: "summary",
      nameKey: "aiSummary",
      icon: Sparkles,
      count: summaryWordCount,
    },
  ], [transcriptWordCount, summaryWordCount]);

  const handleTabChange = useCallback((tabId: TabType) => {
    setActiveTab(tabId);
  }, []);

  const isOllamaUnavailable = Boolean(ollamaCheck && !ollamaCheck.isAvailable);
  const isGenerating = generateSummaryMutation.isPending;
  const isRegenerating = deleteSummaryMutation.isPending || generateSummaryMutation.isPending;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{t(tab.nameKey)}</span>
                {tab.count && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                    isActive
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  }`}>
                    {tab.count.toLocaleString()} {t("words")}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === "transcript" && <TranscriptDisplay transcript={transcript} />}

        {activeTab === "summary" && (
          <div className="space-y-4">
            {isOllamaUnavailable && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">{t("ollamaUnavailable")}</h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{t("ollamaInstructions")}</p>
                  </div>
                </div>
              </div>
            )}

            {!summary && !isGenerating && (
              <div className="text-center py-12">
                <Sparkles className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t("noSummaryYet")}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{t("generateSummaryDescription")}</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  {SUMMARY_BUTTON_CONFIGS.map((config) => (
                    <SummaryButton
                      key={config.style}
                      config={config}
                      onClick={handleGenerateSummary}
                      disabled={isGenerating || isOllamaUnavailable}
                      selectedLanguage={selectedLanguage}
                    />
                  ))}
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="text-center py-12">
                <LoadingSpinner size="lg" className="text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t("generatingSummary")}</h3>
                <p className="text-gray-600 dark:text-gray-400">{t("generatingDescription")}</p>
              </div>
            )}

            {summary && !isGenerating && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("aiSummary")}</h3>
                  </div>
                  <button
                    onClick={() => handleRegenerateSummary(summary)}
                    disabled={isRegenerating}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                    {t("regenerate")}
                  </button>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">{summary.summary}</p>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                  <span>{t("model")}: {summary.model}</span>
                  <span>{t("generated")}: {new Date(summary.createdAt).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
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
  { style: "concise" as SummaryStyle, colorClass: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-700/30", textKey: "concise" as keyof typeof TRANSLATIONS },
  { style: "detailed" as SummaryStyle, colorClass: "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-700/30", textKey: "detailed" as keyof typeof TRANSLATIONS },
  { style: "bullet-points" as SummaryStyle, colorClass: "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg shadow-purple-600/25 hover:shadow-xl hover:shadow-purple-700/30", textKey: "bulletPoints" as keyof typeof TRANSLATIONS }
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
      className={`px-6 py-3 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${config.colorClass}`}
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
    <div className="w-full max-w-4xl mx-auto bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50">
      <div className="border-b border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-700/30 rounded-t-xl">
        <nav className="relative -mb-px flex space-x-1 p-2" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-all duration-200 rounded-lg group ${
                  isActive
                    ? "bg-white/90 dark:bg-slate-600/90 text-blue-600 dark:text-blue-400 shadow-md shadow-blue-600/10 dark:shadow-blue-400/20 border border-blue-200/30 dark:border-blue-500/30 scale-[1.02]"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-600/50 hover:scale-[1.01] active:scale-[0.99]"
                }`}
              >
                <Icon className={`h-4 w-4 transition-transform duration-200 ${
                  isActive ? "text-blue-600 dark:text-blue-400" : "group-hover:scale-110"
                }`} />
                <span>{t(tab.nameKey)}</span>
                {tab.count && (
                  <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-500/30"
                      : "bg-slate-100/80 dark:bg-slate-600/60 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-500/30 group-hover:bg-slate-200/80 dark:group-hover:bg-slate-500/60"
                  }`}>
                    {tab.count.toLocaleString()} {t("words")}
                  </span>
                )}
                {isActive && (
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-50/20 to-indigo-50/20 dark:from-blue-950/20 dark:to-indigo-950/20 pointer-events-none" />
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
              <div className="bg-gradient-to-r from-amber-50/90 to-yellow-50/90 dark:from-amber-950/40 dark:to-yellow-950/40 border border-amber-200/60 dark:border-amber-800/60 rounded-xl p-4 backdrop-blur-sm animate-in fade-in-0 duration-300">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">{t("ollamaUnavailable")}</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">{t("ollamaInstructions")}</p>
                  </div>
                </div>
              </div>
            )}

            {!summary && !isGenerating && (
              <div className="text-center py-12 animate-in fade-in-0 duration-500">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 mb-6">
                  <Sparkles className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">{t("noSummaryYet")}</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">{t("generateSummaryDescription")}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
              <div className="text-center py-12 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/60 dark:border-blue-800/60 rounded-xl backdrop-blur-sm animate-in fade-in-0 duration-500">
                <div className="flex-shrink-0 mb-4">
                  <LoadingSpinner size="lg" className="text-blue-600 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">{t("generatingSummary")}</h3>
                <p className="text-blue-700 dark:text-blue-300 leading-relaxed">{t("generatingDescription")}</p>
              </div>
            )}

            {summary && !isGenerating && (
              <div className="space-y-6 animate-in fade-in-0 duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40">
                      <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("aiSummary")}</h3>
                  </div>
                  <button
                    onClick={() => handleRegenerateSummary(summary)}
                    disabled={isRegenerating}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-100/70 dark:bg-slate-700/70 hover:bg-slate-200/80 dark:hover:bg-slate-600/80 text-slate-700 dark:text-slate-300 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-slate-200/50 dark:border-slate-600/50 backdrop-blur-sm disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <RefreshCw className={`h-4 w-4 transition-transform duration-200 ${isRegenerating ? 'animate-spin' : ''}`} />
                    <span className="font-medium">{t("regenerate")}</span>
                  </button>
                </div>

                <div className="bg-slate-50/70 dark:bg-slate-900/70 rounded-xl p-6 border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm shadow-sm">
                  <p className="text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap text-sm">{summary.summary}</p>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-medium">{t("model")}: <span className="text-slate-600 dark:text-slate-300">{summary.model}</span></span>
                  <span className="font-medium">{t("generated")}: <span className="text-slate-600 dark:text-slate-300">{new Date(summary.createdAt).toLocaleString()}</span></span>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
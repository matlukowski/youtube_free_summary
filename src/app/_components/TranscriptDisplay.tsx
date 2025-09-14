"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import type { TranscriptData } from "~/types/transcript";

interface TranscriptDisplayProps {
  transcript: TranscriptData;
}

export function TranscriptDisplay({ transcript }: TranscriptDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcript.transcript);
      setCopied(true);
      toast.success("Transkrypt został skopiowany do schowka!");

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Nie udało się skopiować transkryptu");
    }
  };

  const handleOpenVideo = () => {
    window.open(transcript.youtubeUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-500">
      {/* Enhanced Action Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleOpenVideo}
          className="flex items-center gap-2 px-4 py-3 min-h-[48px] text-sm bg-slate-100/70 dark:bg-slate-700/70 hover:bg-slate-200/80 dark:hover:bg-slate-600/80 text-slate-700 dark:text-slate-300 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-slate-200/50 dark:border-slate-600/50 backdrop-blur-sm font-medium shadow-sm touch-manipulation"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Zobacz film</span>
        </button>

        <button
          onClick={handleCopyToClipboard}
          className="flex items-center gap-2 px-4 py-3 min-h-[48px] text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-700/30 font-medium touch-manipulation"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              <span>Skopiowane!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Kopiuj</span>
            </>
          )}
        </button>
      </div>

      {/* Enhanced Transcript Content */}
      <div className="relative">
        <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent hover:scrollbar-thumb-slate-400 dark:hover:scrollbar-thumb-slate-500 transition-colors">
          <div className="bg-gradient-to-br from-slate-50/70 to-slate-100/70 dark:from-slate-900/70 dark:to-slate-800/70 rounded-xl p-6 border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap text-sm selection:bg-blue-200/30 dark:selection:bg-blue-800/30">
              {transcript.transcript}
            </div>
          </div>
        </div>

        {/* Scroll Fade Effect */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white/80 to-transparent dark:from-slate-800/80 pointer-events-none rounded-b-xl"></div>
      </div>

      {/* Enhanced Footer with Statistics */}
      <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {transcript.transcript.split(/\s+/).length.toLocaleString()}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Słów
            </div>
          </div>

          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {transcript.transcript.length.toLocaleString()}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Znaków
            </div>
          </div>

          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {Math.ceil(transcript.transcript.split(/\s+/).length / 200)}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Min czytania
            </div>
          </div>

          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {transcript.transcript.split(/[.!?]+/).filter(s => s.trim().length > 0).length}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Zdań
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
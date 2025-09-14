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
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handleOpenVideo}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Zobacz film</span>
        </button>

        <button
          onClick={handleCopyToClipboard}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
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

      {/* Transcript Content */}
      <div className="max-h-96 overflow-y-auto">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap text-sm">
            {transcript.transcript}
          </div>
        </div>
      </div>

      {/* Footer with word count */}
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
        <span>
          Liczba słów: {transcript.transcript.split(/\s+/).length.toLocaleString()}
        </span>
        <span>
          Liczba znaków: {transcript.transcript.length.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
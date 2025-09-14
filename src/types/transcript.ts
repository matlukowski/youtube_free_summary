export interface TranscriptData {
  id: string;
  youtubeUrl: string;
  videoTitle: string | null;
  transcript: string;
  language: string | null;
  createdAt: Date;
}

export interface TranscriptSummary {
  id: string;
  youtubeUrl: string;
  videoTitle: string | null;
  language: string | null;
  createdAt: Date;
}

export type SupportedLanguage = "en" | "pl";
export type TabType = "transcript" | "summary";
export type SummaryStyle = "concise" | "detailed" | "bullet-points";
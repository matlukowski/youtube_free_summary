import { exec } from "child_process";
import { promisify } from "util";
import { readFileSync, unlinkSync, existsSync } from "fs";
import path from "path";
import os from "os";
import { YOUTUBE_URL_PATTERNS } from "~/utils/constants";

const execAsync = promisify(exec);

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  url: string;
}

export interface TranscriptData {
  text: string;
  language?: string;
}

export class YouTubeError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "YouTubeError";
  }
}

/**
 * Advanced transcript cleaning function to remove duplicates and redundancy
 */
export function cleanTranscript(text: string): string {
  if (!text || text.trim() === "") {
    return "";
  }

  // Step 1: Basic normalization
  let cleaned = text
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/\n+/g, " ") // Remove line breaks
    .trim();

  // Step 2: Remove exact duplicate sentences (case-insensitive)
  const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim());
  const uniqueSentences = [];
  const seenSentences = new Set();

  for (const sentence of sentences) {
    const normalized = sentence.trim().toLowerCase();
    if (normalized && !seenSentences.has(normalized)) {
      seenSentences.add(normalized);
      uniqueSentences.push(sentence.trim());
    }
  }

  // Step 3: Remove repeated n-grams (2-5 words)
  let result = uniqueSentences.join(". ");

  // Function to remove repeated n-grams
  const removeRepeatedNGrams = (text: string, n: number): string => {
    const words = text.split(/\s+/);
    const nGrams = new Map<string, number>();
    const nGramPositions = [];

    // Count n-grams and track positions
    for (let i = 0; i <= words.length - n; i++) {
      const nGram = words.slice(i, i + n).join(" ").toLowerCase();
      nGrams.set(nGram, (nGrams.get(nGram) || 0) + 1);
      nGramPositions.push({ nGram, start: i, end: i + n });
    }

    // Mark repeated n-grams for removal (keep first occurrence)
    const toRemove = new Set<number>();
    const seen = new Set<string>();

    for (const { nGram, start, end } of nGramPositions) {
      if (nGrams.get(nGram)! > 1) {
        if (seen.has(nGram)) {
          // Mark this occurrence for removal
          for (let i = start; i < end; i++) {
            toRemove.add(i);
          }
        } else {
          seen.add(nGram);
        }
      }
    }

    // Build result without removed words
    return words
      .filter((_, index) => !toRemove.has(index))
      .join(" ");
  };

  // Apply n-gram deduplication (start with longer n-grams)
  for (let n = 5; n >= 2; n--) {
    result = removeRepeatedNGrams(result, n);
  }

  // Step 4: Final cleanup
  result = result
    .replace(/\s*\.\s*\./g, ".") // Remove double periods
    .replace(/\s+/g, " ") // Normalize spaces again
    .replace(/\s*([.!?])\s*/g, "$1 ") // Fix punctuation spacing
    .trim();

  // Step 5: Ensure proper sentence ending
  if (result && !/[.!?]$/.test(result)) {
    result += ".";
  }

  return result;
}

export async function extractVideoId(url: string): Promise<string> {
  const match = YOUTUBE_URL_PATTERNS.find(pattern => pattern.test(url))?.exec(url);
  if (match?.[1]) {
    return match[1];
  }

  throw new YouTubeError("Invalid YouTube URL format");
}

export async function getVideoInfo(url: string): Promise<YouTubeVideoInfo> {
  try {
    const videoId = await extractVideoId(url);
    const command = `yt-dlp --print "%(id)s|%(title)s|%(webpage_url)s" "${url}"`;

    const { stdout, stderr } = await execAsync(command);

    if (stderr && stderr.includes("ERROR")) {
      throw new YouTubeError(`yt-dlp error: ${stderr}`);
    }

    const [id, title, videoUrl] = stdout.trim().split("|");

    if (!id || !title) {
      throw new YouTubeError("Failed to extract video information");
    }

    return {
      id,
      title,
      url: videoUrl || url,
    };
  } catch (error) {
    if (error instanceof YouTubeError) {
      throw error;
    }
    throw new YouTubeError(`Failed to get video info: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function getTranscript(url: string): Promise<TranscriptData> {
  const videoId = await extractVideoId(url);
  const tempDir = os.tmpdir();

  // Try different subtitle configurations
  const configs = [
    { lang: "en", auto: true, name: "English (auto)" },
    { lang: "en", auto: false, name: "English (manual)" },
    { lang: "pl", auto: true, name: "Polish (auto)" },
    { lang: "pl", auto: false, name: "Polish (manual)" },
  ];

  for (const config of configs) {
    try {
      // Construct filename that yt-dlp will create
      const filename = `${videoId}.${config.lang}.vtt`;
      const filepath = path.join(tempDir, filename);

      // Remove existing file if it exists
      if (existsSync(filepath)) {
        unlinkSync(filepath);
      }

      // Build yt-dlp command
      const autoFlag = config.auto ? "--write-auto-subs" : "--write-subs";
      const command = `yt-dlp ${autoFlag} --sub-lang ${config.lang} --sub-format vtt --skip-download --output "${tempDir}/%(id)s.%(ext)s" "${url}"`;

      console.log(`Attempting to download ${config.name} subtitles...`);
      const { stdout, stderr } = await execAsync(command);

      // Check if file was created
      if (existsSync(filepath)) {
        try {
          const vttContent = readFileSync(filepath, "utf-8");
          const transcriptText = parseVTTContent(vttContent);

          // Clean up temp file
          unlinkSync(filepath);

          if (transcriptText.trim()) {
            console.log(`Successfully extracted ${config.name} transcript`);
            const cleanedTranscript = cleanTranscript(transcriptText);
            console.log(`Cleaned transcript: ${cleanedTranscript.length} characters (was ${transcriptText.length})`);
            return {
              text: cleanedTranscript,
              language: config.lang,
            };
          }
        } catch (readError) {
          console.error(`Error reading subtitle file: ${readError}`);
          // Clean up temp file if it exists
          if (existsSync(filepath)) {
            unlinkSync(filepath);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to get ${config.name} subtitles:`, error instanceof Error ? error.message : String(error));
      continue;
    }
  }

  throw new YouTubeError("No subtitles/transcript available for this video. The video may not have captions, or they may be disabled.");
}

function parseVTTContent(vttContent: string): string {
  const lines = vttContent.split("\n");
  const textLines: string[] = [];
  let inCueBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() || "";

    // Skip WEBVTT header and metadata
    if (line.startsWith("WEBVTT") || line.startsWith("NOTE") || line === "") {
      continue;
    }

    // Check if this is a timestamp line (contains -->)
    if (line.includes("-->")) {
      inCueBlock = true;
      continue;
    }

    // Check if this is a cue identifier (standalone number or text)
    if (!inCueBlock && /^[\w\d-]+$/.test(line)) {
      continue;
    }

    // If we're in a cue block and this is text content
    if (inCueBlock && line !== "") {
      // Clean the text
      const cleanText = line
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")
        .trim();

      if (cleanText) {
        textLines.push(cleanText);
      }
    }

    // Empty line resets the cue block
    if (line === "") {
      inCueBlock = false;
    }
  }

  // Join lines and clean up extra whitespace
  let result = textLines.join(" ").replace(/\s+/g, " ").trim();

  // Remove duplicate sentences (common in auto-generated captions)
  const sentences = result.split(/[.!?]+/).filter(s => s.trim());
  const uniqueSentences = [...new Set(sentences.map(s => s.trim()))];

  return uniqueSentences.join(". ").trim() + (uniqueSentences.length > 0 ? "." : "");
}

export async function validateYtDlp(): Promise<boolean> {
  try {
    const { stdout } = await execAsync("yt-dlp --version");
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}
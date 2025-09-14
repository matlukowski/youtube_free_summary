import { Ollama } from "ollama";

// Initialize Ollama client
const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || "http://localhost:11434"
});

// Default model configuration (upgraded to qwen2.5:14b for better quality)
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:14b";

export type SupportedLanguage = "en" | "pl";

export class OllamaError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "OllamaError";
  }
}

export interface SummaryOptions {
  model?: string;
  maxLength?: number;
  style?: "concise" | "detailed" | "bullet-points";
  language: SupportedLanguage;
}


// Language configuration
const LANGUAGE_CONFIG = {
  en: {
    name: "English",
    code: "en",
    summaryInstruction: "Respond in English"
  },
  pl: {
    name: "Polish",
    code: "pl",
    summaryInstruction: "Odpowiedz w języku polskim"
  }
};

/**
 * Check if Ollama is available and running
 */
export async function checkOllamaAvailable(): Promise<boolean> {
  try {
    await ollama.list();
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a specific model is available
 */
export async function checkModelAvailable(model: string): Promise<boolean> {
  try {
    const models = await ollama.list();
    return models.models.some(m => m.name === model);
  } catch {
    return false;
  }
}


/**
 * Generate AI summary of transcript in the specified language
 */
/**
 * Preprocess transcript before AI analysis
 */
function preprocessTranscript(transcript: string): string {
  // Basic validation
  if (!transcript || transcript.trim() === "") {
    throw new OllamaError("Transcript is empty or invalid");
  }

  // Normalize and clean
  let processed = transcript
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  // Check if transcript seems corrupted (too many repetitions)
  const words = processed.split(/\s+/);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const repetitionRatio = words.length / uniqueWords.size;

  if (repetitionRatio > 3) {
    console.warn(`High repetition ratio detected: ${repetitionRatio.toFixed(2)}. Transcript may need additional cleaning.`);
  }

  return processed;
}

/**
 * Split long transcript into chunks for processing
 */
function chunkTranscript(transcript: string, maxChunkSize: number = 8000): string[] {
  if (transcript.length <= maxChunkSize) {
    return [transcript];
  }

  const chunks = [];
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim());
  let currentChunk = "";

  for (const sentence of sentences) {
    const sentenceWithPunctuation = sentence.trim() + ".";

    if ((currentChunk + sentenceWithPunctuation).length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentenceWithPunctuation;
      } else {
        // Single sentence is too long, force split
        chunks.push(sentenceWithPunctuation);
      }
    } else {
      currentChunk += (currentChunk ? " " : "") + sentenceWithPunctuation;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export async function generateSummary(
  transcript: string,
  options: SummaryOptions
): Promise<string> {
  const model = options.model || DEFAULT_MODEL;
  const maxLength = options.maxLength || 500;
  const style = options.style || "concise";
  const langConfig = LANGUAGE_CONFIG[options.language];

  // Preprocess transcript
  const processedTranscript = preprocessTranscript(transcript);

  // Handle long transcripts with chunking
  const chunks = chunkTranscript(processedTranscript, 8000);
  console.log(`Processing transcript in ${chunks.length} chunk(s)`);

  // Check if Ollama is available
  const isAvailable = await checkOllamaAvailable();
  if (!isAvailable) {
    throw new OllamaError("Ollama is not running. Please start Ollama service.");
  }

  // Check if model is available
  const modelAvailable = await checkModelAvailable(model);
  if (!modelAvailable) {
    throw new OllamaError(`Model "${model}" is not available. Please pull the model first.`);
  }

  let stylePrompt = "";
  switch (style) {
    case "detailed":
      stylePrompt = options.language === "pl"
        ? "Stwórz szczegółowe podsumowanie obejmujące wszystkie kluczowe punkty i ważne szczegóły."
        : "Create a detailed summary that covers all key points and important details.";
      break;
    case "bullet-points":
      stylePrompt = options.language === "pl"
        ? "Stwórz podsumowanie w formie punktów, podkreślając główne tematy."
        : "Create a summary in bullet points format, highlighting the main topics.";
      break;
    default:
      stylePrompt = options.language === "pl"
        ? "Stwórz zwięzłe podsumowanie, które uchwytuje główne idee i kluczowe punkty."
        : "Create a concise summary that captures the main ideas and key points.";
  }

  // Process chunks
  if (chunks.length === 1) {
    // Single chunk - process normally
    const prompt = options.language === "pl"
      ? `Jesteś ekspertem od analizy i podsumowywania treści wideo. Twoim zadaniem jest stworzenie wysokiej jakości podsumowania transkryptu YouTube.

INSTRUKCJE:
- ${stylePrompt}
- Ogranicz się do ${maxLength} słów
- ${langConfig.summaryInstruction}
- ZIGNORUJ wszelkie powtórzenia i redundancje w transkrypcie
- Skup się WYŁĄCZNIE na unikalnej treści i głównych punktach
- Wyodrębnij kluczowe informacje, pomijając dublowane fragmenty
- Stwórz spójne i merytoryczne podsumowanie

Transkrypt YouTube (może zawierać powtórzenia):
${chunks[0]}

Podsumowanie (bez powtórzeń, tylko unikalna treść):`
      : `You are an expert at analyzing and summarizing video content. Your task is to create a high-quality summary of this YouTube transcript.

INSTRUCTIONS:
- ${stylePrompt}
- Keep it under ${maxLength} words
- ${langConfig.summaryInstruction}
- IGNORE any repetitions and redundancies in the transcript
- Focus ONLY on unique content and main points
- Extract key information while skipping duplicated fragments
- Create a coherent and substantive summary

YouTube Transcript (may contain repetitions):
${chunks[0]}

Summary (no repetitions, unique content only):`;

    try {
      const response = await ollama.generate({
        model,
        prompt,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: Math.max(maxLength * 3, 2000),
          repeat_penalty: 1.1,
          top_k: 40,
        },
      });

      if (!response.response || response.response.trim() === "") {
        throw new OllamaError("Generated summary is empty");
      }

      return response.response.trim();
    } catch (error) {
      if (error instanceof OllamaError) {
        throw error;
      }
      throw new OllamaError(
        `Failed to generate summary: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  } else {
    // Multiple chunks - summarize each chunk then combine
    const chunkSummaries = [];
    const chunkMaxLength = Math.ceil(maxLength / chunks.length);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const prompt = options.language === "pl"
        ? `Podsumuj ten fragment transkryptu YouTube (część ${i + 1} z ${chunks.length}). ${stylePrompt} Ogranicz się do ${chunkMaxLength} słów. ${langConfig.summaryInstruction}.

Fragment:
${chunk}

Podsumowanie:`
        : `Summarize this YouTube transcript fragment (part ${i + 1} of ${chunks.length}). ${stylePrompt} Keep it under ${chunkMaxLength} words. ${langConfig.summaryInstruction}.

Fragment:
${chunk}

Summary:`;

      try {
        const response = await ollama.generate({
          model,
          prompt,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            num_predict: Math.max(chunkMaxLength * 2, 500),
            repeat_penalty: 1.1,
            top_k: 40,
          },
        });

        if (response.response && response.response.trim()) {
          chunkSummaries.push(response.response.trim());
        }
      } catch (error) {
        console.error(`Failed to summarize chunk ${i + 1}:`, error);
        // Continue with other chunks
      }
    }

    if (chunkSummaries.length === 0) {
      throw new OllamaError("Failed to generate any chunk summaries");
    }

    // Combine chunk summaries into final summary
    const combinedSummary = chunkSummaries.join(" ");
    const finalPrompt = options.language === "pl"
      ? `Połącz te fragmenty podsumowań w jedno spójne podsumowanie. ${stylePrompt} Maksymalnie ${maxLength} słów. ${langConfig.summaryInstruction}.

Fragmenty podsumowań:
${combinedSummary}

Finalne podsumowanie:`
      : `Combine these summary fragments into one coherent summary. ${stylePrompt} Maximum ${maxLength} words. ${langConfig.summaryInstruction}.

Summary fragments:
${combinedSummary}

Final summary:`;

    try {
      const response = await ollama.generate({
        model,
        prompt: finalPrompt,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: Math.max(maxLength * 2, 1000),
          repeat_penalty: 1.1,
          top_k: 40,
        },
      });

      if (!response.response || response.response.trim() === "") {
        // Fallback to combined summaries if final combination fails
        return combinedSummary.slice(0, maxLength * 8); // Rough word limit
      }

      return response.response.trim();
    } catch (error) {
      console.error("Failed to combine summaries, returning combined fragments");
      return combinedSummary.slice(0, maxLength * 8); // Fallback
    }
  }
}




/**
 * Get supported languages
 */
export function getSupportedLanguages() {
  return Object.entries(LANGUAGE_CONFIG).map(([code, config]) => ({
    code: code as SupportedLanguage,
    name: config.name
  }));
}